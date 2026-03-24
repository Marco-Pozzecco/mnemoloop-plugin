import { Indexes } from "@/types/indexes";
import { Plugin } from "obsidian";

export interface AppProps {
  plugin: Plugin;
  indexes: Indexes;
}

export type AppViews = "dashboard" | "review"
