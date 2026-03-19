import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Variables } from "@style/theme";

interface CouponModalProps {
  coupon: any;
  onClose: () => void;
}

export default function CouponModal({ coupon, onClose }: CouponModalProps) {
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Ionicons name="close" size={24} color={Variables.colors.text} />
          </TouchableOpacity>

          <View style={styles.modalImageWrapper}>
            {coupon.reward?.image_url ? (
              <Image source={{ uri: coupon.reward.image_url }} style={styles.modalImage} />
            ) : (
              <View style={[styles.modalImage, styles.imagePlaceholder]}>
                <Ionicons name="gift-outline" size={48} color={Variables.colors.textLight} />
              </View>
            )}
          </View>

          <Text style={styles.modalTitle}>{coupon.reward?.title || "Reward"}</Text>
          <Text style={styles.modalBusiness}>{coupon.reward?.business_name || ""}</Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Jouw coupon code</Text>
            <Text style={styles.codeText}>{coupon.code}</Text>
          </View>

          {coupon.reward?.valid_until && (
            <Text style={styles.modalValidity}>
              Geldig tot {new Date(coupon.reward.valid_until).toLocaleDateString("nl-BE")}
            </Text>
          )}

          <Text style={styles.codeInstructions}>
            Toon deze code aan de kassa om je reward in te wisselen.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Variables.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Variables.sizes.lg,
    paddingBottom: Variables.sizes.xl + Variables.sizes.lg,
  },
  modalClose: {
    alignSelf: "flex-end",
    marginBottom: Variables.sizes.sm,
  },
  modalImageWrapper: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: Variables.sizes.md,
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontFamily: Variables.fonts.bold,
    fontSize: Variables.textSizes.lg,
    color: Variables.colors.text,
    marginBottom: Variables.sizes.xs,
  },
  modalBusiness: {
    fontFamily: Variables.fonts.regular,
    fontSize: Variables.textSizes.sm,
    color: Variables.colors.textLight,
    marginBottom: Variables.sizes.md,
  },
  modalValidity: {
    fontFamily: Variables.fonts.semibold,
    fontSize: Variables.textSizes.sm,
    color: Variables.colors.textLight,
    marginBottom: Variables.sizes.md,
    textAlign: "center",
  },
  codeBox: {
    backgroundColor: Variables.colors.background,
    borderRadius: 14,
    padding: Variables.sizes.md,
    alignItems: "center",
    marginVertical: Variables.sizes.md,
    borderWidth: 2,
    borderColor: Variables.colors.primary,
    borderStyle: "dashed",
  },
  codeLabel: {
    fontFamily: Variables.fonts.semibold,
    fontSize: Variables.textSizes.sm,
    color: Variables.colors.textLight,
    marginBottom: Variables.sizes.xs,
  },
  codeText: {
    fontFamily: Variables.fonts.extrabold,
    fontSize: Variables.textSizes.lg,
    color: Variables.colors.primary,
    letterSpacing: 3,
  },
  codeInstructions: {
    fontFamily: Variables.fonts.regular,
    fontSize: Variables.textSizes.sm,
    color: Variables.colors.textLight,
    textAlign: "center",
    lineHeight: 20,
  },
});