<script setup>
useHead({ title: 'Documentation — fleurıs' })

const steps = [
  {
    title: '1. Start with a graph',
    detail: 'Create a graph for a topic, project, class, or question you care about. Give it a simple name so you can easily find it later.',
  },
  {
    title: '2. Add the pieces',
    detail: 'Put in the things on your mind: ideas you want to understand, sources you want to remember, questions you’re exploring, and tasks you need to do.',
  },
  {
    title: '3. Connect what belongs together',
    detail: 'Draw links to show relationships. Some things fit under a bigger topic, while others are simply related. These connections are what turn scattered notes into a clear map.',
  },
  {
    title: '4. Revisit and grow it',
    detail: 'As you learn more, move things around, add details, and create new links. Your graph can change with your thinking instead of locking you into one structure.',
  },
  {
    title: '5. Keep a personal copy',
    detail: 'When something matters, save a copy of your graph as a file. It’s an easy way to keep a backup or take your work with you.',
  },
]

const dashboardActions = [
  { name: 'Open your graphs', detail: 'See the graphs you’ve been working on and jump back into any of them.' },
  { name: 'Create something new', detail: 'Start a fresh graph whenever a new topic or project begins.' },
  { name: 'Find quickly', detail: 'Search by name or description when your collection grows.' },
  { name: 'Make a copy', detail: 'Duplicate a graph if you want to explore a new direction without changing the original.' },
  { name: 'Save a file copy', detail: 'Export a graph as a file for safekeeping or sharing.' },
  { name: 'Bring a file in', detail: 'Import a saved graph file to continue working on it.' },
  { name: 'Remove what you don’t need', detail: 'Delete graphs you no longer want to keep around.' },
]

const nodeTypes = [
  { name: 'Concept', color: '#8CA4FF', detail: 'A main idea or topic you want to understand — like “Climate systems” or “Essay outline”.' },
  { name: 'Resource', color: '#F5A623', detail: 'Something helpful to return to, such as an article, book, video, note, or reference.' },
  { name: 'Question', color: '#C084FC', detail: 'Something you’re curious about or still need to figure out.' },
  { name: 'Task', color: '#34D399', detail: 'A next step or action, like “Read chapter 2” or “Compare sources”.' },
]

const shortcuts = [
  { keys: 'Esc', action: 'Step back: close menus, cancel what you started, or clear your selection.' },
  { keys: 'Ctrl + S / Cmd + S', action: 'Save your current work.' },
  { keys: 'Delete / Backspace', action: 'Remove the selected item when you’re not typing.' },
  { keys: 'Enter', action: 'Confirm a name or edit you’re finishing.' },
]

const helps = [
  {
    title: 'When your notes feel scattered',
    detail: 'Instead of keeping ideas in separate places, fleurıs helps you put them in one view so you can see how they connect.',
    accent: 'border-[#3155D9] bg-[#3155D9]/[0.04]',
  },
  {
    title: 'When you forget why something mattered',
    detail: 'By linking an idea to its source, related question, or next step, you keep the context that made it useful.',
    accent: 'border-[#8CA4FF] bg-[#8CA4FF]/[0.08]',
  },
  {
    title: 'When your thinking changes',
    detail: 'Graphs are easy to reshape. You can add, move, rename, and reconnect things as your understanding grows.',
    accent: 'border-[#34D399] bg-[#34D399]/[0.08]',
  },
]
</script>

<template>
  <div class="w-full px-6 py-12 md:px-12 md:py-16 lg:px-20">
    <header class="border-b border-neutral-300 pb-10">
      <p class="text-xs uppercase tracking-[0.2em] text-[#3155D9] geist-500">Guide</p>
      <h1 class="mt-4 text-4xl geist-500 tracking-tight text-[#17191F] md:text-5xl">How fleurıs helps, and how to use it</h1>
      <p class="mt-5 max-w-4xl text-base leading-relaxed text-neutral-600 geist-400 md:text-lg">
        fleurıs is for the moments when your ideas are related, but your notes don’t show it. It gives you a simple visual way to connect what you know, what you’re asking, what you’ve found, and what you need to do next.
      </p>
      <div class="mt-5 border-l-2 border-[#3155D9] bg-[#3155D9]/[0.04] px-5 py-4">
        <p class="text-sm leading-relaxed text-neutral-700 geist-400 md:text-base">
          <span class="geist-500 text-[#17191F]">Simple by design:</span> no account is needed to get started, your work stays with you, and you can keep a personal file copy of any graph whenever you want.
          <span class="geist-500 text-[#2445BB]"> Sign-in will be added later</span> to make it easier to access your work across places.
        </p>
      </div>
    </header>

    <div class="mt-12 space-y-14">
      <section>
        <h2 class="text-2xl geist-500 tracking-tight text-[#17191F]">The problem fleurıs solves</h2>
        <div class="mt-5 grid gap-4 lg:grid-cols-3">
          <article v-for="item in helps" :key="item.title" :class="['border-l-2 p-5', item.accent]">
            <h3 class="text-base geist-500 tracking-tight text-[#17191F]">{{ item.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-neutral-700 geist-400 md:text-base">{{ item.detail }}</p>
          </article>
        </div>
      </section>

      <section class="border-t border-neutral-300 pt-10">
        <h2 class="text-2xl geist-500 tracking-tight text-[#17191F]">How to use it, step by step</h2>
        <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <article v-for="step in steps" :key="step.title" class="border border-neutral-300 bg-white/40 p-5">
            <h3 class="text-base geist-500 tracking-tight text-[#17191F]">{{ step.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-neutral-600 geist-400">{{ step.detail }}</p>
          </article>
        </div>
      </section>

      <section class="border-t border-neutral-300 pt-10">
        <h2 class="text-2xl geist-500 tracking-tight text-[#17191F]">What you can do in fleurıs</h2>
        <div class="mt-6 grid gap-8 xl:grid-cols-2">
          <div>
            <h3 class="text-lg geist-500 tracking-tight text-[#17191F]">In your graph library</h3>
            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <article v-for="item in dashboardActions" :key="item.name" class="border border-neutral-300 bg-white/40 p-4">
                <p class="text-sm geist-500 text-[#17191F]">{{ item.name }}</p>
                <p class="mt-2 text-sm leading-relaxed text-neutral-600 geist-400">{{ item.detail }}</p>
              </article>
            </div>
          </div>
          <div class="space-y-6">
            <div>
              <h3 class="text-lg geist-500 tracking-tight text-[#17191F]">In the editor</h3>
              <div class="mt-3 space-y-3 text-sm leading-relaxed text-neutral-600 geist-400 md:text-base">
                <p><span class="geist-500 text-[#17191F]">Move around freely:</span> zoom in to focus, zoom out to see the whole picture, and arrange ideas wherever they make sense.</p>
                <p><span class="geist-500 text-[#17191F]">Give each idea a clear place:</span> add a title and a short description so you remember what it means later.</p>
                <p><span class="geist-500 text-[#17191F]">Show relationships:</span> link items as part of a bigger topic, or as related ideas that inform each other.</p>
                <p><span class="geist-500 text-[#17191F]">Change things anytime:</span> rename, edit, reconnect, or remove items as your thinking evolves.</p>
              </div>
            </div>
            <div class="border-l-2 border-[#F5A623] bg-[#F5A623]/[0.08] px-5 py-4">
              <p class="text-sm leading-relaxed text-neutral-700 geist-400 md:text-base">
                A good graph doesn’t have to be perfect. Start small, make a few honest connections, and let it grow naturally over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="border-t border-neutral-300 pt-10">
        <h2 class="text-2xl geist-500 tracking-tight text-[#17191F]">Types of things you can add</h2>
        <p class="mt-4 max-w-4xl text-sm leading-relaxed text-neutral-600 geist-400 md:text-base">
          Giving each item a type makes your graph easier to read at a glance.
        </p>
        <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article v-for="item in nodeTypes" :key="item.name" class="border border-neutral-300 bg-white/40 p-5">
            <div class="flex items-center gap-2">
              <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: item.color }"></span>
              <h3 class="text-base geist-500 tracking-tight text-[#17191F]">{{ item.name }}</h3>
            </div>
            <p class="mt-2 text-sm leading-relaxed text-neutral-600 geist-400">{{ item.detail }}</p>
          </article>
        </div>
      </section>

      <section class="border-t border-neutral-300 pt-10">
        <h2 class="text-2xl geist-500 tracking-tight text-[#17191F]">Helpful shortcuts</h2>
        <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div v-for="item in shortcuts" :key="item.keys" class="border border-neutral-300 bg-white/40 p-4">
            <kbd class="inline-flex rounded border border-neutral-300 bg-[#F5F4EF] px-2.5 py-1 text-xs geist-500 text-[#17191F]">{{ item.keys }}</kbd>
            <p class="mt-3 text-sm leading-relaxed text-neutral-600 geist-400">{{ item.action }}</p>
          </div>
        </div>
      </section>

      <section class="border-t border-neutral-300 pt-10">
        <h2 class="text-2xl geist-500 tracking-tight text-[#17191F]">Your work, kept simple</h2>
        <div class="mt-4 grid gap-4 lg:grid-cols-3">
          <div class="border border-neutral-300 bg-white/40 p-5">
            <p class="text-xs uppercase tracking-[0.16em] text-[#3155D9] geist-500">No account needed</p>
            <p class="mt-2 text-sm leading-relaxed text-neutral-600 geist-400 md:text-base">You can start using fleurıs right away without signing up.</p>
          </div>
          <div class="border border-neutral-300 bg-white/40 p-5">
            <p class="text-xs uppercase tracking-[0.16em] text-[#3155D9] geist-500">Stays with you</p>
            <p class="mt-2 text-sm leading-relaxed text-neutral-600 geist-400 md:text-base">Your graphs stay with you on this device, so your thinking space feels personal and close at hand.</p>
          </div>
          <div class="border border-neutral-300 bg-white/40 p-5">
            <p class="text-xs uppercase tracking-[0.16em] text-[#3155D9] geist-500">Easy to keep a copy</p>
            <p class="mt-2 text-sm leading-relaxed text-neutral-600 geist-400 md:text-base">You can save a graph as a file anytime — helpful for backups, moving your work, or sharing it with someone you trust.</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
