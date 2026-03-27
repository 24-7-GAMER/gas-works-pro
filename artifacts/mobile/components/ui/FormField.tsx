import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { useColorScheme } from "react-native";
import Colors from "@/constants/colors";
import { fontSize, radius, spacing } from "@/constants/theme";

interface FormFieldProps extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
}

export function FormField({ label, required, error, style, ...props }: FormFieldProps) {
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
        {required && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: error ? colors.danger : colors.cardBorder,
            color: colors.text,
          },
          style,
        ]}
        placeholderTextColor={colors.textTertiary}
        autoCorrect={false}
        {...props}
      />
      {error ? (
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      ) : null}
    </View>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  required?: boolean;
}

export function SelectField({ label, value, options, onSelect, required }: SelectFieldProps) {
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];
  const selected = options.find(o => o.value === value);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
        {required && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
      <View
        style={[
          styles.select,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <Text style={[styles.selectText, { color: selected ? colors.text : colors.textTertiary }]}>
          {selected?.label ?? "Select..."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontFamily: "Inter_500Medium",
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    fontFamily: "Inter_400Regular",
    minHeight: 48,
  },
  error: {
    fontSize: fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  select: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 48,
    justifyContent: "center",
  },
  selectText: {
    fontSize: fontSize.md,
    fontFamily: "Inter_400Regular",
  },
});
