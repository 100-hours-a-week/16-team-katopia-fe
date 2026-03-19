"use client";

import { type IMessage, type StompSubscription, Client } from "@stomp/stompjs";
import { useCallback, useEffect, useRef, useState } from "react";

import { API_BASE_URL, CHAT_SOCKET_URL } from "@/src/config/api";
import {
  getAccessToken,
  isAccessTokenExpired,
  issueAccessToken,
} from "@/src/lib/auth";

type UseChatSocketConnectionParams = {
  enabled?: boolean;
};

type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

function buildSocketUrl() {
  if (CHAT_SOCKET_URL) {
    return CHAT_SOCKET_URL;
  }

  try {
    const apiUrl = new URL(API_BASE_URL);
    const protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${apiUrl.host}/api/ws/chat`;
  } catch {
    return "ws://dev.fitcheck.kr/ws/chat";
  }
}

function buildSocketHost() {
  return "dev.fitcheck.kr";
}

export function useChatSocketConnection({
  enabled = true,
}: UseChatSocketConnectionParams) {
  const clientRef = useRef<Client | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("idle");

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let cancelled = false;

    const connect = async () => {
      try {
        setStatus("connecting");

        let token = getAccessToken();
        if (!token || isAccessTokenExpired(token)) {
          token = await issueAccessToken();
        }
        if (!token || cancelled) return;
        const host = buildSocketHost();

        const client = new Client({
          brokerURL: buildSocketUrl(),
          reconnectDelay: 5000,
          debug: (value) => {
            if (process.env.NODE_ENV !== "production") {
              console.log("[chat:socket] stomp", value);
            }
          },
          connectHeaders: {
            "accept-version": "1.2",
            host,
            Authorization: `Bearer ${token}`,
          },
          onConnect: () => {
            if (cancelled) return;
            if (process.env.NODE_ENV !== "production") {
              console.log("[chat:socket] connected", buildSocketUrl());
            }
            setStatus("connected");
          },
          onStompError: (frame) => {
            if (cancelled) return;
            if (process.env.NODE_ENV !== "production") {
              console.error("[chat:socket] stomp error", {
                command: frame.command,
                headers: frame.headers,
                body: frame.body,
              });
            }
            setStatus("error");
          },
          onWebSocketError: (event) => {
            if (cancelled) return;
            if (process.env.NODE_ENV !== "production") {
              console.error("[chat:socket] websocket error", event);
            }
            setStatus("error");
          },
          onWebSocketClose: (event) => {
            if (cancelled) return;
            if (process.env.NODE_ENV !== "production") {
              console.error("[chat:socket] websocket close", {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean,
              });
            }
            setStatus("idle");
          },
          onDisconnect: () => {
            if (cancelled) return;
            setStatus("idle");
          },
        });

        clientRef.current = client;
        client.activate();
      } catch (error) {
        if (cancelled) return;
        if (process.env.NODE_ENV !== "production") {
          console.error("[chat:socket] connect failed", error);
        }
        setStatus("error");
      }
    };

    void connect();

    return () => {
      cancelled = true;

      const client = clientRef.current;
      clientRef.current = null;

      if (!client) return;
      void client.deactivate();
    };
  }, [enabled]);

  const subscribe = useCallback(
    (
      destination: string,
      callback: (message: IMessage) => void,
      headers?: Record<string, string>,
    ): StompSubscription | null => {
      const client = clientRef.current;
      if (!client?.connected) return null;
      return client.subscribe(destination, callback, headers);
    },
    [],
  );

  const publish = useCallback(
    ({
      destination,
      body,
      headers,
    }: {
      destination: string;
      body?: string;
      headers?: Record<string, string>;
    }) => {
      const client = clientRef.current;
      if (!client?.connected) {
        throw new Error("채팅 소켓이 아직 연결되지 않았습니다.");
      }

      client.publish({ destination, body, headers });
    },
    [],
  );

  return { status, subscribe, publish };
}
