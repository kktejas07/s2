/**
 * NativeWind's `className` prop, declared for TypeScript.
 *
 * This normally arrives from react-native-css-interop, which nativewind
 * depends on. In this install that package lands nested under nativewind/
 * rather than hoisted, and its augmentation does not take effect from there:
 * TypeScript resolves the `react-native` it augments relative to the nested
 * copy, so it augments nothing this app can see.
 *
 * Hoisting it is not the answer either - react-native-css-interop pulls
 * react-native-reanimated 4.x, which requires React Native 0.86 against the
 * 0.76 Expo SDK 52 is built on.
 *
 * So the augmentation is written out here. It is types only; the runtime
 * behaviour comes from the babel plugin either way. The consequence of it
 * having been missing is that every styled element in the app was a type
 * error - the app had simply never been typechecked.
 */
import "react-native";

declare module "react-native" {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ImagePropsBase {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
    placeholderClassName?: string;
  }
  interface SwitchProps {
    className?: string;
  }
  interface TouchableWithoutFeedbackProps {
    className?: string;
  }
  interface ScrollViewProps {
    contentContainerClassName?: string;
  }
}
