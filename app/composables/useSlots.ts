import { getSlotById, slots } from '~/constants/slots'

export const useSlotCatalog = () => {
  const query = ref('')
  const normalizedQuery = computed(() => query.value.trim().toLocaleLowerCase('pt-BR'))
  const filteredSlots = computed(() => {
    if (!normalizedQuery.value) return slots
    return slots.filter(slot => slot.name.toLocaleLowerCase('pt-BR').includes(normalizedQuery.value))
  })
  return { slots, query, filteredSlots, getSlotById }
}
