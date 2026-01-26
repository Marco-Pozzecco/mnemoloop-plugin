import { Unsubscriber, writable } from "svelte/store"
import { BaseStoreManager } from "./base";

export interface Session { };

export const DefaultSessionState: Session = {};

export const SessionStore = writable(DefaultSessionState);

class SessionStoreManager extends BaseStoreManager<Session> {
  constructor() {
    super(DefaultSessionState, SessionStore)
  }
}

export type ISessionStoreManager = typeof SessionStoreManager;
export const sessionStoreManager = new SessionStoreManager();
