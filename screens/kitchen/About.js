import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { observer } from 'mobx-react';
import { useStores } from '../../stores';
import React from 'react';
import { Box } from '@gluestack-ui/themed';

const About = observer(({ navigation }) => {
  const { noteStore, userStore } = useStores();
  const now = new Date().toTimeString();
  return (
    <View>
      <Link href='/' asChild>
        <Pressable>
          <Text>Home</Text>
        </Pressable>
      </Link>

      <Pressable onPress={() => userStore.setUserName(now)}>
        <Text>Home {userStore.name}</Text>
      </Pressable>
      <Box>
        <Text>{JSON.stringify(userStore)}</Text>
      </Box>
    </View>
  );
});

export default About;
