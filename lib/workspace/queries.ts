import { createClient } from "@/lib/supabase/server"
import type {
  Channel,
  ChannelAgent,
  ChannelContextVersion,
  ChannelDetail,
  InstructionVersion,
  Message,
  MessageAuthor,
  SharedAsset,
  WorkflowAnnotation,
  Workspace,
  WorkspaceAgent,
  WorkspaceSnapshot,
} from "@/types/agent-workspace"
import {
  createTerraTechSeed,
} from "@/lib/agents/alex-design-system"
import {
  mapAgentDefinition,
  mapChannel,
  mapChannelAgent,
  mapChannelContextVersion,
  mapInstructionVersion,
  mapMessage,
  mapSharedAsset,
  mapWorkflowAnnotation,
  mapWorkspace,
  mapWorkspaceAgent,
} from "./mappers"

/** Default role aliases when summoning agents into project channels */
const DEFAULT_ROLE_ALIASES: Record<string, { alias: string; instructions: string }> = {
  atlas: {
    alias: "Analyst",
    instructions: "Research topics, analyze data, and report findings with clear recommendations.",
  },
  nova: {
    alias: "Engineer",
    instructions: "Write, review, and ship code. Follow project conventions and propose minimal diffs.",
  },
  sage: {
    alias: "Strategist",
    instructions: "Prioritize work, define success metrics, and align the team on goals.",
  },
  echo: {
    alias: "Writer",
    instructions: "Draft clear copy, documents, and user-facing content for this project.",
  },
  scout: {
    alias: "Coordinator",
    instructions: "Track tasks, surface blockers, and keep the supervisor informed of status.",
  },
  alex: {
    alias: "Alex",
    instructions:
      "Own the TerraTech design system: tokens, shadcn/ui components, Tailwind theme, and responsive layouts. Keep /terratech demo pages synced.",
  },
  mira: {
    alias: "Mira",
    instructions:
      "Define motion tokens, micro-interactions, and page transitions. Document reduced-motion fallbacks and share motion spec artifacts.",
  },
  avery: {
    alias: "Avery",
    instructions:
      "Audit WCAG 2.2 AA for all TerraTech surfaces. Check contrast against Alex's tokens, keyboard flow, and ARIA patterns.",
  },
  blake: {
    alias: "Blake",
    instructions:
      "Maintain brand book: logo usage, voice, photography. Review artboards for compliance and share logo/mark assets.",
  },
  jordan: {
    alias: "Jordan",
    instructions:
      "Run weekly design crits. Review progress from Alex, Mira, Avery, and Blake. Summarize status, risks, and direction decisions.",
  },
}

const DEMO_CHANNELS = [
  {
    name: "terratech-studio",
    domain: "Cohort Studio",
    description:
      "Multiplayer design workflow — Alex, Mira, Avery, Blake, and Jordan collaborate in real time. Each agent works their lane and annotates only within their expertise.",
    agentSlugs: ["alex", "mira", "avery", "blake", "jordan"] as const,
    aliases: ["Alex", "Mira", "Avery", "Blake", "Jordan"] as const,
    instructions: [
      "Own TerraTech tokens, shadcn/ui components, and /terratech demo sync. Execute design system tasks; annotate only on system/token topics.",
      "Define motion tokens and micro-interactions. Execute motion tasks; annotate on animation/transition topics only.",
      "Audit WCAG 2.2 AA. Execute a11y tasks; annotate on contrast, focus, and keyboard topics only.",
      "Guard logo, voice, and photography. Execute brand tasks; annotate on visual identity topics only.",
      "Synthesize cross-team workflow. Run crits and annotate on alignment, risks, and decisions — never override specialist deliverables.",
    ],
    designSystemSeed: true,
    defaultAgentSlug: "alex",
    multiplayer: true,
  },
  {
    name: "terratech-design-system",
    domain: "Design System",
    description: "Alex owns TerraTech tokens, shadcn/ui components, and /terratech demo sync.",
    agentSlugs: ["alex"] as const,
    aliases: ["Alex"] as const,
    instructions: [
      "Build and maintain TerraTech design system: earthy green primary, Terra Sans, responsive spacing. Keep /terratech synced to tokens.js.",
    ],
    designSystemSeed: true,
    defaultAgentSlug: "alex",
  },
  {
    name: "terratech-motion",
    domain: "Motion",
    description: "Mira defines motion tokens, micro-interactions, and reduced-motion specs for TerraTech.",
    agentSlugs: ["mira"] as const,
    aliases: ["Mira"] as const,
    instructions: [
      "Document duration/easing tokens, Button/Dialog animations, hero entrance. Always include prefers-reduced-motion fallbacks.",
    ],
    defaultAgentSlug: "mira",
  },
  {
    name: "terratech-accessibility",
    domain: "Accessibility",
    description: "Avery audits TerraTech for WCAG 2.2 AA — contrast, keyboard, screen readers.",
    agentSlugs: ["avery"] as const,
    aliases: ["Avery"] as const,
    instructions: [
      "Run accessibility audits on /terratech pages and design system components. Produce remediation specs for Alex.",
    ],
    defaultAgentSlug: "avery",
  },
  {
    name: "terratech-brand",
    domain: "Brand",
    description: "Blake guards TerraTech logo, voice, photography, and brand compliance.",
    agentSlugs: ["blake"] as const,
    aliases: ["Blake"] as const,
    instructions: [
      "Share logo SVGs, brand book excerpts, and review artboards for voice and visual consistency.",
    ],
    defaultAgentSlug: "blake",
  },
  {
    name: "terratech-design-crit",
    domain: "Design Leadership",
    description: "Jordan runs weekly design crits — aligns Alex, Mira, Avery, and Blake on TerraTech direction.",
    agentSlugs: ["jordan"] as const,
    aliases: ["Jordan"] as const,
    instructions: [
      "Weekly design crit: review cross-channel progress, flag drift, assign follow-ups. Reference shared artboards and assets.",
    ],
    defaultAgentSlug: "jordan",
  },
  {
    name: "new-product-launch-design",
    domain: "Product Launch",
    description:
      "Eco-friendly gadget line — Alex builds the design system; artboards auto-sync.",
    agentSlugs: ["alex", "sage"] as const,
    aliases: ["Alex", "BrandManager"] as const,
    instructions: [
      "Build the design system from scratch: color tokens, typography, shadcn/ui components, responsive layouts. Keep all product-page artboards synced to the latest system version.",
      "Define brand strategy — Sustainable Innovation: clean design, natural elements, user-friendliness. Provide feedback on color and typography choices.",
    ],
    designSystemSeed: true,
  },
  {
    name: "design-system",
    domain: "Design",
    description:
      "Single source of truth for tokens, components, and artboards — shadcn/ui + Tailwind CSS, responsive across all form factors.",
    agentSlugs: ["alex", "sage"] as const,
    aliases: ["Alex", "Brand"] as const,
    instructions: [
      "Manage the design system end-to-end: color tokens, typography, spacing, native shadcn components, and responsive breakpoints. Ensure every artboard auto-aligns to the latest system version.",
      "Define brand strategy constraints — voice, color personality, accessibility — that Alex's system must express consistently.",
    ],
  },
  {
    name: "marketing-campaign-q3",
    domain: "Marketing",
    description: "Q3 product launch campaign — ad copy, creatives, and performance tracking.",
    agentSlugs: ["echo", "alex", "atlas"] as const,
    aliases: ["Writer", "Alex", "Analyst"] as const,
    instructions: [
      "Generate creative ad copy for our new product targeting young professionals.",
      "Produce on-brand visual creatives and component specs from the shared design system. Ensure assets match current tokens.",
      "Track campaign performance and report on key metrics.",
    ],
  },
  {
    name: "website-redesign",
    domain: "Product",
    description: "Website redesign — design system, UX, frontend implementation, and analytics.",
    agentSlugs: ["sage", "alex", "nova"] as const,
    aliases: ["UX", "Alex", "Frontend"] as const,
    instructions: [
      "Define UX goals and information architecture for the redesign.",
      "Evolve the design system for the redesign: responsive layouts, shadcn primitives, token updates. Keep artboards in sync.",
      "Implement frontend components in Tailwind following Alex's latest specs.",
    ],
  },
  {
    name: "customer-support",
    domain: "Support",
    description: "Customer support escalations and response drafting.",
    agentSlugs: ["echo", "scout"] as const,
    aliases: ["Support", "Escalator"] as const,
    instructions: [
      "Draft empathetic, clear customer responses.",
      "Track escalations, follow up on open items, and flag blockers.",
    ],
  },
]

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

async function createChannelAgentsForChannel(
  channelId: string,
  workspaceAgents: Array<{ id: string; agent_definitions: { slug: string } | null }>,
  config?: {
    slugs?: readonly string[]
    aliases?: readonly string[]
    instructions?: readonly string[]
  }
): Promise<void> {
  const supabase = await createClient()
  const rows = workspaceAgents
    .filter((wa) => {
      if (!config?.slugs) return true
      return config.slugs.includes(wa.agent_definitions?.slug ?? "")
    })
    .map((wa, i) => {
      const slug = wa.agent_definitions?.slug ?? ""
      const defaults = DEFAULT_ROLE_ALIASES[slug]
      return {
        channel_id: channelId,
        workspace_agent_id: wa.id,
        role_alias: config?.aliases?.[i] ?? defaults?.alias ?? slug,
        instructions: config?.instructions?.[i] ?? defaults?.instructions ?? "",
        instructions_version: 1.0,
        status: "idle" as const,
      }
    })

  if (rows.length) {
    await supabase.from("channel_agents").insert(rows)
  }
}

export async function getOrCreateWorkspace(userId: string): Promise<Workspace | null> {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (existing) {
    await syncWorkspaceAgents(existing.id, userId)
    return mapWorkspace(existing)
  }

  const { data: created, error } = await supabase
    .from("workspaces")
    .insert({ owner_id: userId, name: "Agent HQ" })
    .select()
    .single()

  if (error || !created) return null

  await bootstrapWorkspace(created.id, userId)
  return mapWorkspace(created)
}

async function bootstrapWorkspace(workspaceId: string, userId: string): Promise<void> {
  const supabase = await createClient()

  const { data: definitions } = await supabase
    .from("agent_definitions")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")

  if (!definitions?.length) return

  const { data: workspaceAgents } = await supabase
    .from("workspace_agents")
    .insert(
      definitions.map((d) => ({
        workspace_id: workspaceId,
        agent_definition_id: d.id,
        current_instructions: ["alex", "mira", "avery", "blake", "jordan"].includes(d.slug)
          ? d.system_prompt
          : "",
      }))
    )
    .select("*, agent_definitions(*)")

  if (!workspaceAgents?.length) return

  // Demo project channels
  for (const demo of DEMO_CHANNELS) {
    const hasAlex = (demo.agentSlugs as readonly string[]).includes("alex")
    const withSeed =
      "designSystemSeed" in demo && (demo as { designSystemSeed?: boolean }).designSystemSeed

    const { data: projectChannel } = await supabase
      .from("channels")
      .insert({
        workspace_id: workspaceId,
        name: demo.name,
        slug: demo.name,
        channel_type: "group",
        domain: demo.domain,
        description: demo.description,
        context_summary: `Project: ${demo.description}`,
        design_system_state:
          withSeed || hasAlex ? createTerraTechSeed(demo.description) : {},
        created_by: userId,
      })
      .select()
      .single()

    if (projectChannel) {
      const assigned = workspaceAgents.filter((wa) => {
        const slug = (wa.agent_definitions as { slug: string } | null)?.slug
        return slug && (demo.agentSlugs as readonly string[]).includes(slug)
      })

      await supabase.from("channel_members").insert([
        { channel_id: projectChannel.id, member_type: "user", user_id: userId },
        ...assigned.map((a) => ({
          channel_id: projectChannel.id,
          member_type: "agent" as const,
          workspace_agent_id: a.id,
        })),
      ])

    const defaultSlug =
      "defaultAgentSlug" in demo
        ? (demo as { defaultAgentSlug?: string }).defaultAgentSlug
        : undefined
    const defaultWa = defaultSlug
      ? assigned.find(
          (a) => (a.agent_definitions as { slug: string } | null)?.slug === defaultSlug
        )
      : undefined

    if (defaultWa) {
      await supabase
        .from("channels")
        .update({ default_agent_id: defaultWa.id })
        .eq("id", projectChannel.id)
    }

      await createChannelAgentsForChannel(projectChannel.id, assigned, {
        slugs: demo.agentSlugs,
        aliases: demo.aliases,
        instructions: demo.instructions,
      })

      await supabase.from("messages").insert({
        channel_id: projectChannel.id,
        author_type: "system",
        message_type: "normal",
        content: `Channel created. Assigned: ${demo.aliases.map((a) => `@${a}`).join(", ")}. Edit instructions in the Context panel →`,
        metadata: { type: "channel_created" },
      })
    }
  }

  // Direct message channels
  for (const wa of workspaceAgents) {
    const def = wa.agent_definitions as { slug: string; name: string } | null
    if (!def) continue

    const { data: dmChannel } = await supabase
      .from("channels")
      .insert({
        workspace_id: workspaceId,
        name: def.name,
        slug: `dm-${def.slug}`,
        channel_type: "direct",
        description: `Direct line to ${def.name}`,
        default_agent_id: wa.id,
        created_by: userId,
      })
      .select()
      .single()

    if (dmChannel) {
      await supabase.from("channel_members").insert([
        { channel_id: dmChannel.id, member_type: "user", user_id: userId },
        { channel_id: dmChannel.id, member_type: "agent", workspace_agent_id: wa.id },
      ])
      await createChannelAgentsForChannel(dmChannel.id, [wa])
    }
  }
}

/** Ensure new agent definitions (e.g. Alex) exist on workspaces created before they were added */
async function syncWorkspaceAgents(workspaceId: string, userId: string): Promise<void> {
  const supabase = await createClient()

  const { data: definitions } = await supabase
    .from("agent_definitions")
    .select("*")
    .eq("is_active", true)

  if (!definitions?.length) return

  const { data: existingAgents } = await supabase
    .from("workspace_agents")
    .select("agent_definition_id, agent_definitions(slug)")
    .eq("workspace_id", workspaceId)

  const existingDefIds = new Set((existingAgents ?? []).map((a) => a.agent_definition_id))
  const missing = definitions.filter((d) => !existingDefIds.has(d.id))

  if (missing.length) {
    await supabase.from("workspace_agents").insert(
      missing.map((d) => ({
        workspace_id: workspaceId,
        agent_definition_id: d.id,
        current_instructions: ["alex", "mira", "avery", "blake", "jordan"].includes(d.slug)
          ? d.system_prompt
          : "",
      }))
    )
  }

  const alexDef = definitions.find((d) => d.slug === "alex")
  if (!alexDef) return

  const { data: alexWa } = await supabase
    .from("workspace_agents")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("agent_definition_id", alexDef.id)
    .maybeSingle()

  if (!alexWa) return

  // Ensure DM channel for Alex
  const { data: alexDm } = await supabase
    .from("channels")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("slug", "dm-alex")
    .maybeSingle()

  if (!alexDm) {
    const { data: dmChannel } = await supabase
      .from("channels")
      .insert({
        workspace_id: workspaceId,
        name: "Alex",
        slug: "dm-alex",
        channel_type: "direct",
        description: "Direct line to Alex — design system manager",
        default_agent_id: alexWa.id,
        created_by: userId,
      })
      .select()
      .single()

    if (dmChannel) {
      await supabase.from("channel_members").insert([
        { channel_id: dmChannel.id, member_type: "user", user_id: userId },
        { channel_id: dmChannel.id, member_type: "agent", workspace_agent_id: alexWa.id },
      ])
      await createChannelAgentsForChannel(
        dmChannel.id,
        [{ id: alexWa.id, agent_definitions: { slug: "alex" } }],
        { aliases: ["Alex"], instructions: [DEFAULT_ROLE_ALIASES.alex.instructions] }
      )
    }
  }

  // Ensure missing demo project channels (including Alex's design channels)
  const { data: existingChannels } = await supabase
    .from("channels")
    .select("slug")
    .eq("workspace_id", workspaceId)
    .eq("channel_type", "group")

  const existingSlugs = new Set((existingChannels ?? []).map((c) => c.slug))

  const { data: allWa } = await supabase
    .from("workspace_agents")
    .select("*, agent_definitions(*)")
    .eq("workspace_id", workspaceId)

  if (!allWa?.length) return

  for (const demo of DEMO_CHANNELS) {
    if (existingSlugs.has(demo.name)) continue

    const hasAlex = (demo.agentSlugs as readonly string[]).includes("alex")
    const withSeed =
      "designSystemSeed" in demo && (demo as { designSystemSeed?: boolean }).designSystemSeed

    const { data: projectChannel } = await supabase
      .from("channels")
      .insert({
        workspace_id: workspaceId,
        name: demo.name,
        slug: demo.name,
        channel_type: "group",
        domain: demo.domain,
        description: demo.description,
        context_summary: `Project: ${demo.description}`,
        design_system_state:
          withSeed || hasAlex ? createTerraTechSeed(demo.description) : {},
        created_by: userId,
      })
      .select()
      .single()

    if (!projectChannel) continue

    const assigned = allWa.filter((wa) => {
      const slug = (wa.agent_definitions as { slug: string } | null)?.slug
      return slug && (demo.agentSlugs as readonly string[]).includes(slug)
    })

    await supabase.from("channel_members").insert([
      { channel_id: projectChannel.id, member_type: "user", user_id: userId },
      ...assigned.map((a) => ({
        channel_id: projectChannel.id,
        member_type: "agent" as const,
        workspace_agent_id: a.id,
      })),
    ])

    await createChannelAgentsForChannel(projectChannel.id, assigned, {
      slugs: demo.agentSlugs,
      aliases: demo.aliases,
      instructions: demo.instructions,
    })
  }
}

export async function getChannelAgents(channelId: string): Promise<ChannelAgent[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("channel_agents")
    .select("*, workspace_agents(*, agent_definitions(*))")
    .eq("channel_id", channelId)
    .order("created_at")

  return (data ?? []).map((row) => mapChannelAgent(row))
}

export async function getChannelsWithAgents(
  workspaceId: string
): Promise<Channel[]> {
  const supabase = await createClient()
  const { data: channels } = await supabase
    .from("channels")
    .select("*")
    .eq("workspace_id", workspaceId)
    .neq("channel_type", "thread")
    .order("channel_type")
    .order("name")

  if (!channels?.length) return []

  const channelIds = channels.map((c) => c.id)
  const { data: channelAgents } = await supabase
    .from("channel_agents")
    .select("*, workspace_agents(*, agent_definitions(*))")
    .in("channel_id", channelIds)

  const agentsByChannel = new Map<string, ChannelAgent[]>()
  for (const row of channelAgents ?? []) {
    const list = agentsByChannel.get(row.channel_id) ?? []
    list.push(mapChannelAgent(row))
    agentsByChannel.set(row.channel_id, list)
  }

  return channels.map((c) => ({
    ...mapChannel(c),
    assignedAgents: agentsByChannel.get(c.id) ?? [],
  }))
}

export async function getWorkspaceSnapshot(userId: string): Promise<WorkspaceSnapshot | null> {
  const workspace = await getOrCreateWorkspace(userId)
  if (!workspace) return null

  const supabase = await createClient()

  const [agentsResult, channels, assetsResult] = await Promise.all([
    supabase
      .from("workspace_agents")
      .select("*, agent_definitions(*)")
      .eq("workspace_id", workspace.id)
      .order("created_at"),
    getChannelsWithAgents(workspace.id),
    supabase
      .from("shared_assets")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ])

  const agents = (agentsResult.data ?? []).map((row) =>
    mapWorkspaceAgent(
      row,
      row.agent_definitions ? mapAgentDefinition(row.agent_definitions) : undefined
    )
  )

  const assets = (assetsResult.data ?? []).map(mapSharedAsset)

  return { workspace, agents, channels, assets }
}

export async function getWorkflowAnnotations(
  channelId: string,
  limit = 50
): Promise<WorkflowAnnotation[]> {
  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .from("workflow_annotations")
    .select(`
      *,
      workspace_agents(id, custom_name, instructions_version, agent_definitions(name, slug, role, avatar_color, icon))
    `)
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error || !rows?.length) return []

  const channelAgents = await getChannelAgents(channelId)

  return rows.map((row) => {
    let author: MessageAuthor | undefined
    if (row.workspace_agents) {
      const wa = row.workspace_agents as {
        id: string
        custom_name: string | null
        instructions_version: number
        agent_definitions: {
          name: string
          slug: string
          role: string
          avatar_color: string
          icon: string
        } | null
      }
      const def = wa.agent_definitions
      const channelAgent = channelAgents.find((ca) => ca.workspaceAgentId === wa.id)
      author = {
        type: "agent",
        id: wa.id,
        name: channelAgent?.roleAlias ?? wa.custom_name ?? def?.name ?? "Agent",
        avatarColor: def?.avatar_color,
        icon: def?.icon,
        role: def?.role,
        roleAlias: channelAgent?.roleAlias,
      }
    }

    return mapWorkflowAnnotation(row as Record<string, unknown>, author)
  })
}

export async function getChannelDetail(channelId: string): Promise<ChannelDetail | null> {
  const channel = await getChannelById(channelId)
  if (!channel) return null

  const [messages, channelAgents, threads, contextHistory, instructionHistory, annotations] =
    await Promise.all([
      getChannelMessages(channelId, { includeAll: true }),
      getChannelAgents(channelId),
      getThreadChannels(channelId),
      getChannelContextHistory(channelId),
      getChannelInstructionHistory(channelId),
      getWorkflowAnnotations(channelId),
    ])

  const supabase = await createClient()
  const { data: assets } = await supabase
    .from("shared_assets")
    .select("*")
    .or(`channel_id.eq.${channelId},channel_id.is.null`)
    .eq("workspace_id", channel.workspaceId)
    .order("created_at", { ascending: false })
    .limit(50)

  return {
    channel: { ...channel, assignedAgents: channelAgents },
    messages,
    channelAgents,
    assets: (assets ?? []).map(mapSharedAsset),
    contextHistory,
    instructionHistory,
    threads,
    annotations,
  }
}

export async function getChannelMessages(
  channelId: string,
  options?: { threadId?: string | null; includeAll?: boolean }
): Promise<Message[]> {
  const supabase = await createClient()
  const threadId = options?.threadId
  const includeAll = options?.includeAll

  let query = supabase
    .from("messages")
    .select(`
      *,
      workspace_agents(id, custom_name, instructions_version, agent_definitions(name, slug, role, avatar_color, icon))
    `)
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true })

  if (!includeAll) {
    if (threadId) {
      query = query.eq("thread_id", threadId)
    } else {
      query = query.is("thread_id", null)
    }
  }

  const { data: messages } = await query
  if (!messages?.length) return []

  const channelAgents = await getChannelAgents(channelId)
  const aliasByAgentId = new Map(
    channelAgents.map((ca) => [ca.workspaceAgentId, ca])
  )

  const messageIds = messages.map((m) => m.id)
  const { data: assetLinks } = await supabase
    .from("message_assets")
    .select("message_id, shared_assets(*)")
    .in("message_id", messageIds)

  const assetsByMessage = new Map<string, SharedAsset[]>()
  for (const link of assetLinks ?? []) {
    const msgId = link.message_id as string
    const asset = link.shared_assets
    if (!asset) continue
    const list = assetsByMessage.get(msgId) ?? []
    list.push(mapSharedAsset(asset))
    assetsByMessage.set(msgId, list)
  }

  const { data: threadCounts } = await supabase
    .from("channels")
    .select("forked_from_message_id")
    .eq("parent_channel_id", channelId)
    .eq("channel_type", "thread")

  const replyCountByMessage = new Map<string, number>()
  for (const t of threadCounts ?? []) {
    if (t.forked_from_message_id) {
      replyCountByMessage.set(
        t.forked_from_message_id,
        (replyCountByMessage.get(t.forked_from_message_id) ?? 0) + 1
      )
    }
  }

  return messages.map((row) => {
    const author = resolveMessageAuthor(row, aliasByAgentId)
    return mapMessage(
      row,
      author,
      assetsByMessage.get(row.id),
      replyCountByMessage.get(row.id)
    )
  })
}

function resolveMessageAuthor(
  row: Record<string, unknown>,
  aliasByAgentId: Map<string, ChannelAgent>
): Message["author"] | undefined {
  if (row.author_type === "system") {
    return { type: "system", id: "system", name: "System" }
  }

  if (row.author_type === "agent" && row.workspace_agents) {
    const wa = row.workspace_agents as {
      id: string
      custom_name: string | null
      instructions_version: number
      agent_definitions: {
        name: string
        slug: string
        role: string
        avatar_color: string
        icon: string
      } | null
    }
    const def = wa.agent_definitions
    const channelAgent = aliasByAgentId.get(wa.id)
    const displayName = channelAgent?.roleAlias ?? wa.custom_name ?? def?.name ?? "Agent"

    return {
      type: "agent",
      id: wa.id,
      name: displayName,
      avatarColor: def?.avatar_color,
      icon: def?.icon,
      role: def?.role,
      version: channelAgent?.instructionsVersion ?? Number(wa.instructions_version ?? 1),
      roleAlias: channelAgent?.roleAlias,
    }
  }

  if (row.author_type === "user") {
    return { type: "user", id: row.user_id as string, name: "You" }
  }

  return undefined
}

export async function getChannelById(channelId: string): Promise<Channel | null> {
  const supabase = await createClient()
  const { data } = await supabase.from("channels").select("*").eq("id", channelId).maybeSingle()
  return data ? mapChannel(data) : null
}

export async function getThreadChannels(parentChannelId: string): Promise<Channel[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("channels")
    .select("*")
    .eq("parent_channel_id", parentChannelId)
    .eq("channel_type", "thread")
    .order("created_at", { ascending: false })

  return (data ?? []).map(mapChannel)
}

export async function getChannelContextHistory(
  channelId: string
): Promise<ChannelContextVersion[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("channel_context_history")
    .select("*")
    .eq("channel_id", channelId)
    .order("version", { ascending: false })
    .limit(10)

  return (data ?? []).map(mapChannelContextVersion)
}

export async function getChannelInstructionHistory(
  channelId: string
): Promise<InstructionVersion[]> {
  const supabase = await createClient()
  const { data: channelAgents } = await supabase
    .from("channel_agents")
    .select("id")
    .eq("channel_id", channelId)

  const ids = (channelAgents ?? []).map((ca) => ca.id)
  if (!ids.length) return []

  const { data } = await supabase
    .from("agent_instruction_history")
    .select("*")
    .in("channel_agent_id", ids)
    .order("created_at", { ascending: false })
    .limit(20)

  return (data ?? []).map(mapInstructionVersion)
}

export async function appendAgentMemory(
  workspaceAgentId: string,
  delta: string
): Promise<void> {
  const supabase = await createClient()
  const { data: agent } = await supabase
    .from("workspace_agents")
    .select("memory_summary")
    .eq("id", workspaceAgentId)
    .single()

  if (!agent) return

  const existing = agent.memory_summary ?? ""
  const lines = existing.split("\n").filter(Boolean)
  lines.push(`- ${delta}`)
  const trimmed = lines.slice(-20).join("\n")

  await supabase
    .from("workspace_agents")
    .update({ memory_summary: trimmed, updated_at: new Date().toISOString() })
    .eq("id", workspaceAgentId)
}

export async function appendChannelContext(
  channelId: string,
  delta: string,
  userId?: string
): Promise<void> {
  const supabase = await createClient()
  const { data: channel } = await supabase
    .from("channels")
    .select("context_summary")
    .eq("id", channelId)
    .single()

  if (!channel) return

  const existing = channel.context_summary ?? ""
  const updated = existing ? `${existing}\n- ${delta}` : `- ${delta}`
  const trimmed = updated.split("\n").slice(-25).join("\n")

  const { data: history } = await supabase
    .from("channel_context_history")
    .select("version")
    .eq("channel_id", channelId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextVersion = (history?.version ?? 0) + 1

  await supabase
    .from("channels")
    .update({ context_summary: trimmed, updated_at: new Date().toISOString() })
    .eq("id", channelId)

  await supabase.from("channel_context_history").insert({
    channel_id: channelId,
    context_summary: trimmed,
    version: nextVersion,
    created_by: userId ?? null,
  })
}

export async function setAgentStatus(
  workspaceAgentId: string,
  status: string,
  channelAgentId?: string
): Promise<void> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  await supabase
    .from("workspace_agents")
    .update({ status, status_updated_at: now })
    .eq("id", workspaceAgentId)

  if (channelAgentId) {
    await supabase
      .from("channel_agents")
      .update({ status, status_updated_at: now })
      .eq("id", channelAgentId)
  }
}

export { DEFAULT_ROLE_ALIASES, createChannelAgentsForChannel }
