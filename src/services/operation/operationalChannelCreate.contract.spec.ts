import type { useOperationalChannelMutations } from "@/hooks/useOperationalChannels";
import {
  listOperationalMetaPhoneNumbers,
  selectFreeOperationalMetaPhoneNumbers,
} from "@/services/operation/listOperationalMetaPhoneNumbers";
import type { OperationalMetaPhoneNumberAvailability } from "@/types/operation-channels";

const workspaceId = "00000000-0000-0000-0000-000000000000";

async function operationalChannelCreateHttpContract(): Promise<void> {
  const catalog: OperationalMetaPhoneNumberAvailability[] =
    await listOperationalMetaPhoneNumbers(workspaceId);
  const freeNumbers: OperationalMetaPhoneNumberAvailability[] =
    selectFreeOperationalMetaPhoneNumbers(catalog);

  if (freeNumbers.some((phone) => phone.boundWorkspaceId !== null)) {
    throw new Error("BOUND_NUMBER_OFFERED_AS_FREE");
  }
}

void operationalChannelCreateHttpContract;

// The legacy Embedded Signup flow must stay out of the channel creation dialog.
type ChannelMutations = ReturnType<typeof useOperationalChannelMutations>;
const legacyMutations = null as unknown as ChannelMutations;
// @ts-expect-error legacy Embedded Signup removed from the channel creation flow
void legacyMutations.startMetaOnboarding;
// @ts-expect-error legacy Embedded Signup removed from the channel creation flow
void legacyMutations.completeMetaOnboarding;
