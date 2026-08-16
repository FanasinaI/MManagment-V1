package expo.modules.smsreceiver

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Telephony
import androidx.core.content.ContextCompat
import expo.modules.interfaces.permissions.Permissions
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.time.Instant

private val SMS_PERMISSIONS = arrayOf(Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_SMS)

/**
 * Listens for incoming SMS while this app's process is alive and forwards
 * sender/body/timestamp to JS via the "onSmsReceived" event — the JS side
 * (src/domain/sms/pipeline.ts) does the allowlist/parsing, this module only
 * delivers raw messages. The receiver itself only fires while the process
 * is running; startForegroundListening()/stopForegroundListening() (wired
 * to the "Détection SMS" toggle in Settings) keep that process alive in the
 * background via SmsListenerForegroundService, rather than trying to
 * process SMS from a fully-killed app (which would need a headless JS task
 * and an independently-initialized SQLite connection — a lot more moving
 * parts for a real device to prove out first).
 *
 * Written without a Kotlin compiler or Android SDK available in the
 * bootstrap environment (see CLAUDE.md) — mostly untested. The Events/
 * OnCreate/OnDestroy/sendEvent/AsyncFunction shapes and the
 * appContext.permissions flow were cross-checked against the real
 * expo-notifications and expo-local-authentication Kotlin sources shipped
 * in this repo's node_modules, not written from memory. The
 * broadcast-registration flag (ContextCompat.RECEIVER_EXPORTED, required on
 * Android 13+) and the Telephony.Sms.Intents parsing are standard AOSP APIs
 * still unverified end-to-end on-device. What IS confirmed (2026-08-16): the
 * JS-side pipeline correctly parses a real MVola message's exact text once
 * it reaches it — see parser.ts's MOBILE_MONEY_VERB_MAP fix and its
 * regression test. Whether this receiver actually delivered that message in
 * the first place is still unknown (the app may simply not have been
 * running at the time); the foreground service added here is the fix for
 * that specific gap, also unverified.
 */
class SmsReceiverModule : Module() {
  private var receiver: BroadcastReceiver? = null

  private val permissionsManager: Permissions?
    get() = appContext.permissions

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("SmsReceiver")

    Events("onSmsReceived")

    AsyncFunction("requestPermission") { promise: Promise ->
      val manager = permissionsManager
      if (manager == null) {
        promise.resolve(false)
        return@AsyncFunction
      }
      manager.askForPermissions(
        { result: Map<String, PermissionsResponse> ->
          val granted = SMS_PERMISSIONS.all { result[it]?.status == PermissionsStatus.GRANTED }
          promise.resolve(granted)
        },
        *SMS_PERMISSIONS
      )
    }

    AsyncFunction<Boolean>("isPermissionGranted") {
      SMS_PERMISSIONS.all { ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED }
    }

    // Keeps the process (and so the dynamic receiver below) alive while the
    // app is closed/backgrounded — see SmsListenerForegroundService's doc
    // comment for why this needs a persistent notification.
    Function("startForegroundListening") {
      val intent = Intent(context, SmsListenerForegroundService::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    Function("stopForegroundListening") {
      context.stopService(Intent(context, SmsListenerForegroundService::class.java))
    }

    OnCreate {
      val reactContext = appContext.reactContext ?: return@OnCreate
      val smsReceiver = object : BroadcastReceiver() {
        override fun onReceive(receivedContext: Context, intent: Intent) {
          if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
          val receivedAt = Instant.now().toString()
          for (message in Telephony.Sms.Intents.getMessagesFromIntent(intent)) {
            val sender = message.originatingAddress ?: continue
            sendEvent(
              "onSmsReceived",
              mapOf(
                "sender" to sender,
                "body" to (message.messageBody ?: ""),
                "receivedAt" to receivedAt
              )
            )
          }
        }
      }
      receiver = smsReceiver
      ContextCompat.registerReceiver(
        reactContext,
        smsReceiver,
        IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION),
        ContextCompat.RECEIVER_EXPORTED
      )
    }

    OnDestroy {
      receiver?.let {
        try {
          appContext.reactContext?.unregisterReceiver(it)
        } catch (_: IllegalArgumentException) {
          // Already unregistered (e.g. reactContext torn down first) — safe to ignore.
        }
      }
      receiver = null
    }
  }
}
