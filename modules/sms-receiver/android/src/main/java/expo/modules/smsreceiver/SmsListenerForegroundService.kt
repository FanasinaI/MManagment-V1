package expo.modules.smsreceiver

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

/**
 * Exists only to keep this app's process alive in the background so the
 * dynamically-registered BroadcastReceiver in SmsReceiverModule (which only
 * catches SMS while the process is running) keeps working after the user
 * closes/backgrounds the app. Does no SMS handling itself.
 *
 * Android requires a persistent, visible notification for any foreground
 * service — there is no way around that; it's the mandatory tradeoff for
 * being allowed to keep running indefinitely. It disappears the moment the
 * service stops (see stopForegroundListening() below, wired to the
 * "Détection SMS" toggle in Settings > Sources SMS).
 *
 * Untested like the rest of this module (see SmsReceiverModule.kt) — the
 * notification-channel and startForeground() shapes were cross-checked
 * against expo-notifications' real Kotlin sources in this repo's
 * node_modules, not written from memory.
 */
class SmsListenerForegroundService : Service() {
  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val notification = buildNotification()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
    return START_STICKY
  }

  private fun buildNotification(): Notification {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val manager = getSystemService(NotificationManager::class.java)
      if (manager.getNotificationChannel(CHANNEL_ID) == null) {
        val channel = NotificationChannel(CHANNEL_ID, "Détection SMS", NotificationManager.IMPORTANCE_MIN)
        channel.setShowBadge(false)
        manager.createNotificationChannel(channel)
      }
    }
    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("MManagment")
      .setContentText("Détection SMS active")
      .setSmallIcon(applicationInfo.icon)
      .setOngoing(true)
      .setPriority(NotificationCompat.PRIORITY_MIN)
      .build()
  }

  companion object {
    private const val CHANNEL_ID = "sms-detection-service"
    private const val NOTIFICATION_ID = 4821
  }
}
