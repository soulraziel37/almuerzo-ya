import { NativeTabs } from 'expo-router/native-tabs';

import { colors } from '@/theme/tokens';

export default function StudentLayout() {
  return (
    <NativeTabs tintColor={colors.accent}>
      <NativeTabs.Trigger name="menu" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf="fork.knife" md="restaurant" />
        <NativeTabs.Trigger.Label>Menú</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="pedidos" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf="qrcode" md="qr_code" />
        <NativeTabs.Trigger.Label>Mis pedidos</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="perfil" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
