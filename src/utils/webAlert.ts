// Makes React Native's Alert.alert work in the browser.
// react-native-web ships Alert as a no-op, so every Alert.alert() call across
// the app is silently ignored on web. We patch it once at startup to use the
// browser's native alert/confirm dialogs, preserving button onPress callbacks.
import { Alert, Appearance, Platform } from 'react-native';

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  // NativeWind/react-native-css-interop throws "Cannot manually set color scheme"
  // whenever something (Expo's userInterfaceStyle) calls Appearance.setColorScheme
  // on web. The app is light-only, so make that call a harmless no-op to keep the
  // console clean.
  try {
    (Appearance as { setColorScheme: (s: unknown) => void }).setColorScheme = () => {};
  } catch {
    // ignore if the property is not writable
  }

  Alert.alert = (title, message, buttons, _options) => {
    const text = [title, message].filter(Boolean).join('\n\n');

    // No buttons or a single button -> simple alert, then fire its callback.
    if (!buttons || buttons.length === 0) {
      window.alert(text);
      return;
    }
    if (buttons.length === 1) {
      window.alert(text);
      buttons[0]?.onPress?.();
      return;
    }

    // Two or more buttons -> confirm dialog.
    // OK maps to the first non-cancel (confirm/destructive) button,
    // Cancel maps to the button explicitly styled as 'cancel'.
    const confirmBtn = buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];
    const cancelBtn = buttons.find((b) => b.style === 'cancel');

    if (window.confirm(text)) {
      confirmBtn?.onPress?.();
    } else {
      cancelBtn?.onPress?.();
    }
  };
}
