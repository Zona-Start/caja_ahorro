'use client';
import {
  useCurrenciesConfig,
  useExchangeRateConfig,
  useSettingsSystemConfig,
} from '@/hooks/use-setting-system-general';
import { useSystemConfigStore } from '@/store/SystemConfigStore';
import { useEffect } from 'react';
// Ajusta la ruta

function SystemConfigInitializer() {
  const {
    setGeneralConfig,
    setCurrencies,
    setExchangeRates,
    isInitialConfigLoading,
    isInitialConfigError,
  } = useSystemConfigStore();

  const {
    data: settingsData,
    isLoading: isSettingsLoading,
    error: settingsError,
  } = useSettingsSystemConfig();

  const {
    data: currenciesData,
    isLoading: isCurrenciesLoading,
    error: currenciesError,
  } = useCurrenciesConfig();

  const {
    data: exchangeRatesData,
    isLoading: isExchangeRatesLoading,
    error: exchangeRatesError,
  } = useExchangeRateConfig();

  useEffect(() => {
    if (settingsData) {
      setGeneralConfig(settingsData);
    }
    if (currenciesData) {
      setCurrencies(currenciesData);
    }
    if (exchangeRatesData) {
      setExchangeRates(
        exchangeRatesData.map((rate) => ({
          ...rate,
          date: new Date(rate.date),
        })),
      );
    }
  }, [
    setGeneralConfig,
    setCurrencies,
    setExchangeRates,
    settingsData,
    currenciesData,
    exchangeRatesData,
  ]);

  useEffect(() => {
    const loading =
      isSettingsLoading || isCurrenciesLoading || isExchangeRatesLoading;
    const error = settingsError || currenciesError || exchangeRatesError;
    useSystemConfigStore.setState({
      isInitialConfigLoading: loading,
      isInitialConfigError: error,
    });
  }, [
    isSettingsLoading,
    isCurrenciesLoading,
    isExchangeRatesLoading,
    settingsError,
    currenciesError,
    exchangeRatesError,
  ]);

  if (isInitialConfigLoading) {
    return <p>Cargando configuración inicial...</p>;
  }

  if (isInitialConfigError) {
    return (
      <p>
        Error al cargar la configuración inicial:{' '}
        {isInitialConfigError?.message || 'Ocurrió un error'}
      </p>
    );
  }

  // Este componente no necesita renderizar nada visual después de inicializar el estado
  return null;
}

export default SystemConfigInitializer;
