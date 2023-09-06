interface Window {
  Vue: typeof Component;
}

declare global {
  interface Window {
    customProp: string;
    Vue: typeof Component;
  }
}
