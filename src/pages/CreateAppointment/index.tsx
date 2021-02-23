import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAuth } from '../../hooks/auth';
import {
  Container,
  Header,
  BackButton,
  HeaderTitle,
  UserAvatar,
  Content,
  ProvidersListContainer,
  ProvidersList,
  ProviderContainer,
  ProviderAvatar,
  ProviderName,
  Calendar,
  CalendarTitle,
  CalendarButton,
  CalendarButtonText,
  Schedule,
  Section,
  SectionTitle,
  SectionContent,
  SectionHour,
  SectionHourText,
} from './styles';
import api from '../../services/api';

interface RouteParams {
  providerId: string;
}

export interface Provider {
  id: string;
  name: string;
  avatar_url: string;
}

interface AvailabityItem {
  hour: number;
  available: boolean;
}

const CreateAppointment: React.FC = () => {
  const { user } = useAuth();
  const { goBack } = useNavigation();
  const route = useRoute();
  const routeParams = route.params as RouteParams;

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(0);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [availability, setAvailabity] = useState<AvailabityItem[]>([]);
  const [selectedProvider, setSelectedProvider] = useState(
    routeParams.providerId,
  );

  useEffect(() => {
    api.get('providers').then(response => {
      setProviders(response.data);
    });
  }, []);

  useEffect(() => {
    api
      .get(`providers/${selectedProvider}/day-availability`, {
        params: {
          year: selectedDate.getFullYear(),
          month: selectedDate.getMonth() + 1,
          day: selectedDate.getDate(),
        },
      })
      .then(response => {
        setAvailabity(response.data);
      });
  }, [selectedDate, selectedProvider]);

  const navigateBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleSelectProvider = useCallback((providerId: string) => {
    setSelectedProvider(providerId);
    setSelectedHour(0);
  }, []);

  const handleToggleDatePicker = useCallback(() => {
    setShowDatePicker(state => !state);
  }, []);

  const morningAvailability = useMemo(() => {
    return availability
      .filter(({ hour }) => hour < 12)
      .map(({ hour, available }) => ({
        hour,
        available,
        hourFormatted: `${String(hour).padStart(2, '0')}:00`,
      }));
  }, [availability]);

  const afternoonAvailability = useMemo(() => {
    return availability
      .filter(({ hour }) => hour >= 12)
      .map(({ hour, available }) => ({
        hour,
        available,
        hourFormatted: `${String(hour).padStart(2, '0')}:00`,
      }));
  }, [availability]);

  const handleDateChanged = useCallback(
    (event: any, date: Date | undefined) => {
      Platform.OS === 'android' && setShowDatePicker(false);

      if (date) {
        setSelectedDate(date);
        setSelectedHour(0);
      }
    },
    [],
  );

  const handleSelectHour = useCallback((hour: number) => {
    setSelectedHour(hour);
  }, []);

  return (
    <Container>
      <Header>
        <BackButton onPress={navigateBack}>
          <Icon name="chevron-left" size={24} color="#999591" />
        </BackButton>

        <HeaderTitle>Cabeleireiros</HeaderTitle>

        <UserAvatar source={{ uri: user.avatar_url }} />
      </Header>

      <Content>
        <ProvidersListContainer>
          <ProvidersList
            contentContainerStyle={{ paddingHorizontal: 24 }}
            horizontal
            showsHorizontalScrollIndicator={false}
            data={providers}
            keyExtractor={provider => provider.id}
            renderItem={({ item: provider }) => (
              <ProviderContainer
                selected={provider.id === selectedProvider}
                onPress={() => handleSelectProvider(provider.id)}
              >
                <ProviderAvatar source={{ uri: provider.avatar_url }} />

                <ProviderName selected={provider.id === selectedProvider}>
                  {provider.name}
                </ProviderName>
              </ProviderContainer>
            )}
          />
        </ProvidersListContainer>

        <Calendar>
          <CalendarTitle>Escolha a data</CalendarTitle>

          <CalendarButton onPress={handleToggleDatePicker}>
            <CalendarButtonText>Selecionar outra data</CalendarButtonText>
          </CalendarButton>

          {showDatePicker && (
            <DateTimePicker
              {...(Platform.OS === 'ios' && { textColor: '#f4ede8' })}
              mode="date"
              display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
              value={selectedDate}
              onChange={handleDateChanged}
            />
          )}
        </Calendar>

        <Schedule>
          <CalendarTitle>Escolha o horario</CalendarTitle>

          <Section>
            <SectionTitle>Manha</SectionTitle>
            <SectionContent>
              {morningAvailability.map(({ hour, hourFormatted, available }) => (
                <SectionHour
                  key={hour}
                  onPress={() => handleSelectHour(hour)}
                  available={available}
                  selected={selectedHour === hour}
                  enabled={available}
                >
                  <SectionHourText selected={selectedHour === hour}>
                    {hourFormatted}
                  </SectionHourText>
                </SectionHour>
              ))}
            </SectionContent>
          </Section>

          <Section>
            <SectionTitle>Tarde</SectionTitle>
            <SectionContent>
              {afternoonAvailability.map(
                ({ hour, hourFormatted, available }) => (
                  <SectionHour
                    key={hour}
                    onPress={() => handleSelectHour(hour)}
                    available={available}
                    selected={selectedHour === hour}
                    enabled={available}
                  >
                    <SectionHourText selected={selectedHour === hour}>
                      {hourFormatted}
                    </SectionHourText>
                  </SectionHour>
                ),
              )}
            </SectionContent>
          </Section>
        </Schedule>
      </Content>
    </Container>
  );
};

export default CreateAppointment;
