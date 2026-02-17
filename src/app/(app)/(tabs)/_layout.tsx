import { Tabs } from "expo-router";

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
     
       <Tabs.Screen name="home" options={{ headerShown: false }} />
       <Tabs.Screen name="settings" options={{ headerShown: false }} />
     
    </Tabs>
  );
}