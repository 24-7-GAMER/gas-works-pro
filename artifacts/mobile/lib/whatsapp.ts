import { Linking, Platform, Share } from "react-native";

const WHATSAPP_SCHEMES = Platform.OS === "ios"
  ? ["whatsapp://send", "whatsapp-business://send"]
  : ["whatsapp://send"];

export async function openWhatsAppMessage(message: string) {
  const encodedMessage = encodeURIComponent(message);

  for (const baseUrl of WHATSAPP_SCHEMES) {
    try {
      const isAvailable = await Linking.canOpenURL(baseUrl);
      if (!isAvailable) continue;

      await Linking.openURL(`${baseUrl}?text=${encodedMessage}`);
      return { opened: true as const, fallbackUsed: false as const };
    } catch {
      // Try the next known scheme before falling back to the share sheet.
    }
  }

  await Share.share({
    message,
    title: "Share message",
  });

  return { opened: false as const, fallbackUsed: true as const };
}
