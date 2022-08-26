/// <reference types="vite/client" />
declare module '*.png'

declare namespace Intl {
  interface DateTimeFormatOptions {
    dateStyle?: 'full' | 'long' | 'medium' | 'short'
    timeStyle?: 'full' | 'long' | 'medium' | 'short'
  }
}
