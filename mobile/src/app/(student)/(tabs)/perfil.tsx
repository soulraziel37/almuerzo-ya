import { StyleSheet, Text, View } from 'react-native';

import { GroupedList, ListRow } from '@/components/GroupedList';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { useSession } from '@/store/session';
import { colors, radius, type } from '@/theme/tokens';

export default function ProfileScreen() {
  const user = useSession((s) => s.session?.user);
  const initials = (user?.name ?? '')
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('');
  const signOut = useSession((s) => s.signOut);

  return (
    <Screen title="Perfil">
      <GroupedList>
        <ListRow
          title={user?.name ?? ''}
          subtitle={user?.email}
          leading={
            <View accessibilityElementsHidden style={styles.avatar}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          }
        />
      </GroupedList>
      <PrimaryButton title="Cerrar sesión" variant="soft" onPress={() => void signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  initials: { ...type.headline, color: colors.accent },
});
