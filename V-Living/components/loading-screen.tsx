import React from "react";
import {
  Platform,
  StatusBar,
  StyleSheet,
  View
} from "react-native";
import AnimatedLogo from "./illustrations/AnimatedLogo";

// const BRAND = "#D9B200";

export function LoadingScreen() {
  const topInset = Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0;

  return (
    <View style={styles.container}>
      {/* top spacing for Android status bar */}
      <View style={{ height: topInset }} />

      <View style={styles.centerBlock}>
         {/* <Image source={require("@/assets/images/screenKhoa/Logo.svg")} width={130} height={130} /> */}
        <AnimatedLogo width={130} height={190} floatAmplitude={3} durationMs={900}  />
        {/* soft shadow ellipse under the logo */}
        {/* <View style={styles.ellipseShadow} /> */}
        {/* <Text style={styles.brandText}>V-LIVING</Text> */}
      </View>

      {/* <ActivityIndicator size="small" color={BRAND} style={{ marginTop: 24 }} /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", backgroundColor: "#FFFFFF" },
  centerBlock: { flex: 1, alignItems: "center", justifyContent: "center", width: "100%",height: "100%" },
  logo: { width: 130, height: 190 },
  ellipseShadow: {
    width: 72,
    height: 14,
    backgroundColor: "#9CA3AF",
    opacity: 0.45,
    borderRadius: 14,
    marginTop: 8,
  },
  brandText: {
    marginTop: 16,
    letterSpacing: 3,
    color: "#111827",
    fontWeight: "800",
    fontSize: 20,
  },
});