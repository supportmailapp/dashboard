<script lang="ts">
  import { page } from "$app/state";
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import DateTimePicker from "$lib/components/DateTimePicker.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import type { DBGuildProjectionReturns } from "$lib/server/db";
  import { ConfigState } from "$lib/stores/ConfigState.svelte";
  import { APIRoutes } from "$lib/urls";
  import { Button } from "$ui/button";
  import * as Card from "$ui/card/index.js";
  import { Switch } from "$ui/switch";
  import * as Tabs from "$ui/tabs";
  import dayjs from "dayjs";
  import equal from "fast-deep-equal/es6";
  import ky from "ky";
  import { toast } from "svelte-sonner";

  interface PauseState {
    /**
     * If `true`, then tickets are paused.
     */
    isActive: boolean;
    pauseType: "indefinite" | "timed";
    /**
     * ISO 8601 string
     *
     * If null, paused indefinitly
     */
    endDate: string | null;
  }

  const generalTicketsConf = new ConfigState<DBGuildProjectionReturns["generalTicketSettings"]>();
  const pauseState = new ConfigState<PauseState>();

  // $inspect("unsaved", pauseState.unsaved);
  // $inspect("loading", pauseState.loading);
  // $inspect("saving", pauseState.saving);
  $inspect("config", pauseState.config);

  const toPausedUntil = (state: PauseState | null): APIPausedUntil => ({
    value: state?.isActive ?? false, // 'isActive == true' means paused
    date: state?.isActive && state.pauseType === "timed" ? state.endDate : null,
  });

  const toPauseState = (pausedUntil?: APIPausedUntil): PauseState => ({
    isActive: !!pausedUntil?.value,
    pauseType: pausedUntil?.value && pausedUntil?.date ? "timed" : "indefinite",
    endDate: pausedUntil?.date ?? null,
  });

  function setPauseState(newState: Partial<PauseState>) {
    if (!generalTicketsConf.isConfigured()) return;
    const snap = pauseState.snap();
    pauseState.setConfig({
      isActive: newState.isActive ?? snap?.isActive ?? false,
      pauseType: newState.pauseType ?? snap?.pauseType ?? "indefinite",
      endDate: newState.endDate ?? snap?.endDate ?? null,
    });
    const conf = generalTicketsConf.snap()!;
    generalTicketsConf.setConfig({
      ...conf,
      pausedUntil: toPausedUntil(snap),
    });
    pauseState.evalUnsaved();
  }

  async function savePause() {
    if (equal(pauseState.snap(), pauseState.backup)) {
      toast.info("No changes to save.");
      return;
    }

    pauseState.saving = true;

    const generalSnap = generalTicketsConf.snap();
    const pauseSnap = pauseState.snap();

    try {
      if (!generalSnap || !pauseSnap)
        throw new Error("Neither generalSnap nor pauseSnap is set? Something feels wrong...");
      const res = await ky.put(APIRoutes.pausing(page.data.guildId!, "tickets"), {
        json: toPausedUntil(pauseState.snap()),
      });

      if (!res.ok) {
        const errJson = await res.json<any>();
        const errText = errJson?.message || "Unknown Error";
        throw new Error(errText);
      }

      const jsonRes = await res.json<APIPausedUntil>();

      generalTicketsConf.saveConfig({
        ...generalTicketsConf.snap()!,
        pausedUntil: jsonRes,
      });
      pauseState.saveConfig(toPauseState(jsonRes));
    } catch (err: any) {
      toast.error("Failed to save guild configuration.", {
        description: err.message,
      });
      pauseState.saving = false;
    }
  }

  $effect(() => {
    fetch(APIRoutes.ticketsConfig(page.data.guildId!))
      .then((res) => {
        if (!res.ok) {
          toast.error("Failed to load ticket configuration.", {
            description: "Please try again later.",
          });
          return;
        }
        res.json().then((data: DBGuildProjectionReturns["generalTicketSettings"]) => {
          pauseState.saveConfig(toPauseState(data.pausedUntil));
          generalTicketsConf.saveConfig(data);
        });
      })
      .catch((err) => {
        toast.error("Failed to load ticket configuration.", {
          description: err.message,
        });
      });
    // Cleanup
    return () => {
      console.log("Cleaning up ticket configuration state");
      generalTicketsConf.clear();
    };
  });
</script>

<SiteHeading title="Ticket Configuration"></SiteHeading>

<section class="mt-6 w-full max-w-2xl space-y-2">
  {#if generalTicketsConf.isConfigured()}
    <!-- TODO: Find out if the enabled switch is even needed -->
    <div class="flex items-center space-x-2">
      <Label for="tickets-status">
        <Switch id="tickets-status" />
        {generalTicketsConf.config.enabled ? "Enabled" : "Disabled"}
      </Label>
    </div>
    {#if pauseState.isConfigured()}
      <ConfigCard title="Pausing Status" description="Pausing won't reset any settings." saveFn={savePause}>
        <!-- Tabs control 'isActive' -->
        <Tabs.Root
          value={pauseState.config.isActive ? "paused" : "active"}
          onValueChange={(val) =>
            setPauseState({
              isActive: val === "paused",
            })}
        >
          <Tabs.List>
            <Tabs.Trigger value="active">Active</Tabs.Trigger>
            <Tabs.Trigger value="paused">Paused</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="active" class="space-y-4">
            <p>Tickets are <strong>active</strong>, users can create tickets.</p>
          </Tabs.Content>
          <Tabs.Content value="paused" class="space-y-4">
            <p>Tickets are <strong>paused</strong>, users <strong>cannot</strong> create new tickets.</p>
            <!-- Radio group controls 'pauseType' -->
            <RadioGroup.Root
              value={pauseState.config?.pauseType}
              onValueChange={(val) =>
                setPauseState({
                  pauseType: val as "indefinite" | "timed",
                })}
            >
              <div class="flex items-center space-x-2">
                <RadioGroup.Item value="indefinite" id="indefinite" />
                <Label for="indefinite">Indefinitly</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroup.Item value="timed" id="timed" />
                <Label for="timed">Until Date/Time</Label>
              </div>
            </RadioGroup.Root>
            {#if pauseState.config?.pauseType === "timed"}
              <div class="flex flex-col gap-1">
                <Label>Until when?</Label>
                <DateTimePicker
                  onChange={(val: string) => {
                    const djs = dayjs(val);
                    console.log("djs", djs);
                    if (djs.isValid() && pauseState.config) {
                      setPauseState({
                        endDate: val,
                      });
                    } else if (!pauseState) {
                      console.warn("Pause State not initialized???");
                    }
                  }}
                />
              </div>
            {/if}
          </Tabs.Content>
        </Tabs.Root>
      </ConfigCard>
    {/if}
  {:else}
    <div class="grid place-items-center">
      <LoadingSpinner />
    </div>
  {/if}
</section>
