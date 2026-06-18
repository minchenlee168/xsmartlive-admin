<script setup lang="ts">
import { useGlobalToast } from '@/admin/composables/useGlobalToast';
import { useGlobalDialog } from '@/admin/composables/useGlobalDialog';
import { useShopStore, type Shop } from '@/admin/stores/shop';

import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const { showSuccess } = useGlobalToast();
const { confirm } = useGlobalDialog();
const router = useRouter();

const shopStore = useShopStore();
const { shops } = storeToRefs(shopStore);

const formDialog = ref({
  visible: false,
  shopId: null as number | null,
  name: '',
  status: 'active' as Shop['status'],
});

const formDialogTitle = computed(() => formDialog.value.shopId === null
  ? t('merchant_management.store_management.dialog.create')
  : t('merchant_management.store_management.dialog.edit'),
);

const canSaveForm = computed(() => formDialog.value.name.trim().length > 0);

function handleOpenCreate() {
  formDialog.value = {
    visible: true,
    shopId: null,
    name: '',
    status: 'active',
  };
}

function handleOpenEdit(shop: Shop) {
  formDialog.value = {
    visible: true,
    shopId: shop.id,
    name: shop.name,
    status: shop.status,
  };
}

function handleSaveForm() {
  const name = formDialog.value.name.trim();
  if (!name) {
    return;
  }

  if (formDialog.value.shopId === null) {
    const newShop = shopStore.addShop({ name, status: formDialog.value.status });
    showSuccess({ detail: t('merchant_management.store_management.toast.created', { name: newShop.name }) });
  } else {
    shopStore.updateShop(formDialog.value.shopId, {
      name,
      status: formDialog.value.status,
    });
    showSuccess({ detail: t('merchant_management.store_management.toast.updated', { name }) });
  }

  formDialog.value.visible = false;
}

async function handleDelete(shop: Shop) {
  const accepted = await confirm({
    message: t('merchant_management.store_management.dialog.delete_confirm', { name: shop.name }),
  });
  if (!accepted) {
    return;
  }
  shopStore.removeShop(shop.id);
  showSuccess({ detail: t('merchant_management.store_management.toast.deleted', { name: shop.name }) });
}

function handleViewShop(shop: Shop) {
  // 切換 currentShop，並另開分頁進商城前台。原型沒有 Dashboard，改開 `/shop`。
  shopStore.selectShop(shop.id)
  const shopUrl = router.resolve({ path: '/shop', query: { shopId: shop.id } }).href
  window.open(shopUrl, '_blank')
}
</script>

<template>
  <Card>
    <template #title>
      <div class="flex items-center justify-between gap-4">
        <span>{{ t('merchant_management.store_management.title') }}</span>
        <Button
          size="small"
          :label="t('merchant_management.store_management.button.create')"
          @click="handleOpenCreate"
        >
          <template #icon>
            <FontAwesomeIcon :icon="['fas', 'plus']" />
          </template>
        </Button>
      </div>
    </template>
    <template #content>
      <DataTable
        :value="shops"
        striped-rows
        data-key="id"
      >
        <template #empty>
          <div class="text-center py-8 text-color-secondary">
            {{ t('merchant_management.store_management.empty') }}
          </div>
        </template>
        <Column
          field="id"
          :header="t('merchant_management.store_management.table.column.id')"
          style="width: 80px"
        />
        <Column
          field="name"
          :header="t('merchant_management.store_management.table.column.name')"
        />
        <Column
          field="status"
          :header="t('merchant_management.store_management.table.column.status')"
          style="width: 120px"
        >
          <template #body="{ data }">
            <Tag
              :value="t(`merchant_management.store_management.status.${data.status}`)"
              :severity="data.status === 'active' ? 'success' : 'secondary'"
            />
          </template>
        </Column>
        <Column
          field="createdAt"
          :header="t('merchant_management.store_management.table.column.created_at')"
          style="width: 160px"
        />
        <Column
          :header="t('merchant_management.store_management.table.column.actions')"
          style="width: 160px"
        >
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button
                text
                rounded
                size="small"
                severity="secondary"
                :title="t('common.button.edit')"
                @click="handleOpenEdit(data)"
              >
                <template #icon>
                  <FontAwesomeIcon :icon="['far', 'edit']" />
                </template>
              </Button>
              <Button
                text
                rounded
                size="small"
                severity="secondary"
                :title="t('merchant_management.store_management.button.view_shop')"
                @click="handleViewShop(data)"
              >
                <template #icon>
                  <FontAwesomeIcon :icon="['fas', 'arrow-up-right-from-square']" />
                </template>
              </Button>
              <Button
                text
                rounded
                size="small"
                severity="danger"
                :title="t('common.button.delete')"
                @click="handleDelete(data)"
              >
                <template #icon>
                  <FontAwesomeIcon :icon="['fas', 'trash']" />
                </template>
              </Button>
            </div>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <Dialog
    v-model:visible="formDialog.visible"
    modal
    :header="formDialogTitle"
    :style="{ width: '26rem' }"
  >
    <div class="flex flex-col gap-4 pt-2">
      <div class="flex flex-col gap-1">
        <label class="text-sm text-color-secondary">
          {{ t('merchant_management.store_management.form.field.name') }}
        </label>
        <InputText
          v-model="formDialog.name"
          class="w-full"
          :placeholder="t('merchant_management.store_management.form.placeholder.name')"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm text-color-secondary">
          {{ t('merchant_management.store_management.form.field.status') }}
        </label>
        <div class="flex items-center gap-3">
          <ToggleSwitch
            v-model="formDialog.status"
            true-value="active"
            false-value="paused"
          />
          <span class="text-sm">
            {{ t(`merchant_management.store_management.status.${formDialog.status}`) }}
          </span>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button
          text
          severity="secondary"
          :label="t('common.button.cancel')"
          @click="formDialog.visible = false"
        />
        <Button
          :label="t('common.button.save')"
          :disabled="!canSaveForm"
          @click="handleSaveForm"
        />
      </div>
    </template>
  </Dialog>
</template>
