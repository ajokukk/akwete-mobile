import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { colors, fonts } from '../theme';

type BtnKind = 'primary' | 'ghost' | 'google';
export function Button({ title, onPress, kind = 'primary', disabled, loading, style }: {
  title: string; onPress: () => void; kind?: BtnKind; disabled?: boolean; loading?: boolean; style?: ViewStyle;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [s.btn, s[kind], off && { opacity: 0.5 }, pressed && { opacity: 0.8 }, style]}
    >
      {loading ? <ActivityIndicator color={kind === 'primary' ? colors.cotton : colors.ink} /> :
        <Text style={[s.btnText, kind !== 'primary' && { color: colors.ink }]}>{title}</Text>}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected }} onPress={onPress}
      style={[s.chip, selected && { backgroundColor: colors.ink, borderColor: colors.ink }]}>
      <Text style={[s.chipText, selected && { color: colors.cotton }]}>{label}</Text>
    </Pressable>
  );
}

export function Banner({ text, tone = 'warn' }: { text: string; tone?: 'warn' | 'ok' }) {
  return (
    <View style={[s.banner, tone === 'ok' && { borderColor: colors.moss, backgroundColor: 'rgba(31,58,44,0.07)' }]}>
      <Text style={s.bannerText}>{text}</Text>
    </View>
  );
}

export function Field({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor="#8d8a80" style={s.input} {...props} />
    </View>
  );
}

export function Title({ children, size = 40 }: { children: React.ReactNode; size?: number }) {
  return <Text style={{ fontFamily: fonts.display, fontSize: size, lineHeight: size * 1.08, color: colors.text }}>{children}</Text>;
}

const s = StyleSheet.create({
  btn: { minHeight: 50, borderRadius: 99, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  primary: { backgroundColor: colors.ink },
  ghost: { borderWidth: 1, borderColor: colors.ink, backgroundColor: 'transparent' },
  google: { borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff' },
  btnText: { fontFamily: fonts.bold, fontSize: 16, color: colors.cotton },
  chip: { borderWidth: 1, borderColor: 'rgba(13,19,48,0.4)', borderRadius: 99, paddingVertical: 9, paddingHorizontal: 16, marginRight: 8, marginBottom: 8 },
  chipText: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  banner: { borderWidth: 1.5, borderColor: colors.clay, backgroundColor: 'rgba(180,83,47,0.08)', borderRadius: 6, padding: 12, marginBottom: 14 },
  bannerText: { fontFamily: fonts.body, fontSize: 14, color: colors.text, lineHeight: 20 },
  label: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, marginBottom: 6 },
  input: { fontFamily: fonts.body, fontSize: 16, color: colors.text, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(13,19,48,0.35)', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 12 },
});
