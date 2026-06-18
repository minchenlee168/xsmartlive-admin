<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col items-center gap-4 py-10 text-gray-500">
    <FontAwesomeIcon
      :icon="['fas', 'inbox']"
      class="text-4xl"
    />

    <p class="text-sm">
      {{ t('common.no_data') }}
    </p>
  </div>
</template>
