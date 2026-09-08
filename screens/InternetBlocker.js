import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import NetInfo from "@react-native-community/netinfo";

const InternetBlocker = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isUnstable, setIsUnstable] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const hasInternet = state.isConnected && state.isInternetReachable;
      setIsConnected(hasInternet);

      // Detect unstable connection (Weak Wi-Fi or Cellular)
      if (state.type === "wifi" || state.type === "cellular") {
        const isWeak = state.details?.strength && state.details.strength < 50; // Strength < 50 means weak signal
        setIsUnstable(!hasInternet || isWeak);
      } else {
        setIsUnstable(!hasInternet);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{ flex: 1 }}
        pointerEvents={isConnected && !isUnstable ? "auto" : "none"}
      >
        {children}
      </View>

      {!isConnected && (
        <View style={styles.overlay}>
          <Text style={styles.text}>No Internet Connection</Text>
        </View>
      )}

      {isUnstable && isConnected && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>⚠️ Unstable Internet Connection</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  warning: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: "orange",
    padding: 10,
    alignItems: "center",
  },
  warningText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default InternetBlocker;
