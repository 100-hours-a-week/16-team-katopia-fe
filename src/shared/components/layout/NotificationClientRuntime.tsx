"use client";

import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { useNotificationStream } from "@/src/features/notifications/hooks/useNotificationStream";
import { useNotificationsStore } from "@/src/features/notifications/store/notificationsStore";

type NotificationClientRuntimeProps = {
  ready: boolean;
  enabled: boolean;
  toastEnabled?: boolean;
};

export default function NotificationClientRuntime({
  ready,
  enabled,
  toastEnabled = true,
}: NotificationClientRuntimeProps) {
  const clearNotifications = useNotificationsStore((state) => state.clear);

  useEffect(() => {
    if (!ready) return;
    if (enabled) return;
    clearNotifications();
  }, [clearNotifications, enabled, ready]);

  useNotificationStream({
    enabled,
    toastEnabled,
    heartbeatTimeoutMs: 1000 * 60 * 65,
  });

  return (
    <ToastContainer
      position="top-center"
      newestOnTop
      closeOnClick
      closeButton
      draggable
      hideProgressBar
      limit={10}
      theme="light"
      toastStyle={{
        borderRadius: 30,
        background: "rgba(245, 245, 245, 0.88)",
        color: "#121212",
        fontSize: 13,
        fontWeight: 600,
        marginBottom: 5,
      }}
    />
  );
}
