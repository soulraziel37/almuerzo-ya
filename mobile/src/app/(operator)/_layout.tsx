import { NativeTabs } from 'expo-router/native-tabs';

import { colors } from '@/theme/tokens';

export default function OperatorLayout() {
  return (
    <NativeTabs tintColor={colors.accent}>
      <NativeTabs.Trigger name="escanear">
        <NativeTabs.Trigger.Icon sf="qrcode.viewfinder" md="qr_code_scanner" />
        <NativeTabs.Trigger.Label>Escanear</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stock">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'shippingbox', selected: 'shippingbox.fill' }}
          md="inventory_2"
        />
        <NativeTabs.Trigger.Label>Stock</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="menus">
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
        <NativeTabs.Trigger.Label>Menús</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
