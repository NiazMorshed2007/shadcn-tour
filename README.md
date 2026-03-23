## shadcn/tour

A component to make product tours with motion and shadcn/ui.

## Key parts

- [`TourProvider`](#tourprovider): A context provider to make the tour available to the app.
- [`TourAlertDialog`](#touralertdialog): An alert dialog component to begin the tour or skip it.
- [`useTour`](#usetour): A hook about the tour which provides necessary functions and states.

## How to use?

1. First install the packages and necessary components by running the following command:

```bash
pnpx shadcn add https://tour.niazmorshed.dev/tour.json
```

It will add `TourProvider`, `TourAlertDialog` and `useTour` hook in your project under `components/tour.tsx`.

Additionally, a sets of step ids will get added under `lib/tour-constants.ts`.

> Note: `TOUR_STEPS` is the name of the constant that contains the step ids. A step id should be assigned to a selector that is used to highlight the step. It will calculate its position in the viewport and show the step beside it.

2. Next wrap your app with `TourProvider` in `app/layout.tsx` or somewhere else you wish.

```tsx
import { TourProvider } from "@/components/tour";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <TourProvider>{children}</TourProvider>;
}
```

3. Next use the `setSteps` from `useTour` hook to set the steps you want to highlight. And use the `TourAlertDialog` component to show the tour.

```tsx
const steps: TourStep[] = [
  {
    content: <div>Team Switcher</div>,
    selectorId: TOUR_STEP_IDS.TEAM_SWITCHER,
    position: "right",
    onClickWithinArea: () => { },
  },
  {
    content: <div>Writing Area</div>,
    selectorId: TOUR_STEP_IDS.WRITING_AREA,
    position: "left",
    onClickWithinArea: () => { },
  },
];

function Page() {
  const { setSteps } = useTour();
  const [openTour, setOpenTour] = useState(false);

  useEffect(() => {
    setSteps(steps);
    const timer = setTimeout(() => {
      setOpenTour(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [setSteps]);

  return <div>
    <TourAlertDialog open={openTour} onOpenChange={setOpenTour} />
  </div>;
}
```

4. Add the step identifiers to the elements you want to highlight:

```tsx
<div id={TOUR_STEPS.TEAM_SWITCHER.id}>Team Switcher</div>
```

## Element Targeting

Each tour step needs to locate a DOM element to spotlight. You can target elements in two ways:

### By element ID (`selectorId`)

Easily assign an `id` to the element and reference it with `selectorId`:

```tsx
// In your component
<div id="my-element">Hello</div>

// In your tour step
{ selectorId: "my-element", content: <div>...</div> }
```

### By CSS selector (`selector`)

Use any valid CSS selector. This avoids requiring the `id` namespace as it may be used for other purposes already - and works well with component libraries:

```tsx
// Simple data attribute
<Button data-tour="export">Export</Button>
{ selector: '[data-tour="export"]', content: <div>...</div> }

// Any valid CSS selector
<nav className="tour-highlight" data-name="sidebar">...</nav>
{ selector: '.tour-highlight[data-name="sidebar"]', content: <div>...</div> }
```

> **Note:** TypeScript enforces that you provide either `selectorId` or `selector`, but not both. Both approaches can be mixed within the same tour.

## Multiple Named Tours

You can register multiple tours and start them by ID using the `tours` prop on `TourProvider`:

```tsx
import { TourProvider, TourDefinition } from "@/components/tour";

const tours: TourDefinition[] = [
  { id: "intro", steps: introSteps },
  { id: "advanced", steps: advancedSteps },
];

<TourProvider
  tours={tours}
  onComplete={(tourId) => console.log(`${tourId} completed`)}
>
  {children}
</TourProvider>
```

Then start a specific tour by ID:

```tsx
const { startTour } = useTour();

<button onClick={() => startTour("intro")}>Start Intro Tour</button>
<button onClick={() => startTour("advanced")}>Start Advanced Tour</button>
```

> Note: The original `setSteps` + `startTour()` (no arguments) pattern continues to work for single-tour usage.

## Keyboard Navigation

When a tour is active, users can navigate using the keyboard:

- **ArrowRight** — advance to the next step
- **ArrowLeft** — go back to the previous step
- **Escape** — skip/dismiss the tour

## Rounded Spotlight

The spotlight cutout supports configurable padding and border-radius per step:

```tsx
const steps: TourStep[] = [
  {
    content: <div>This element has a rounded spotlight</div>,
    selectorId: "my-element",
    padding: 12,       // spotlight padding around element (default: 8)
    borderRadius: 16,  // spotlight corner radius (default: 8)
  },
];
```

## Skip Button

A "Skip tour" text button appears on every step by default. It is automatically hidden on the last step (where "Finish" is shown instead). You can also hide it on specific steps:

```tsx
const steps: TourStep[] = [
  {
    content: <div>This step has no skip button</div>,
    selectorId: "important-step",
    showSkip: false,
  },
];
```

## Close Button

An optional X icon button can be shown in the top-right of each tooltip. Set `closeable` on `TourProvider` to enable it for all steps, or on individual steps to override:

```tsx
// Enable for all steps in the tour
<TourProvider closeable>
  {children}
</TourProvider>

// Or override per step
const steps: TourStep[] = [
  {
    content: <div>This step has a close button</div>,
    selectorId: "my-element",
    closeable: true,
  },
  {
    content: <div>This step does not</div>,
    selectorId: "other-element",
    closeable: false,
  },
];
```

## Lifecycle Callbacks

`TourProvider` supports callbacks for tour lifecycle events. All callbacks receive the `tourId` as the first argument:

```tsx
<TourProvider
  tours={tours}
  onStart={(tourId) => console.log(`${tourId} started`)}
  onStepChange={(tourId, step) => console.log(`${tourId} moved to step ${step}`)}
  onComplete={(tourId) => console.log(`${tourId} completed`)}
  onSkip={(tourId, step) => console.log(`${tourId} skipped at step ${step}`)}
>
  {children}
</TourProvider>
```

## Scroll Into View

If a target element is off-screen when its step becomes active, the tour automatically scrolls it into view with a smooth animation before highlighting it.

## API Reference

### `TourStep`

Configuration for an individual tour step.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `React.ReactNode` | Required | The content to display in the tooltip |
| `selectorId` | `string` | Required\* | The `id` of the target element to highlight |
| `selector` | `string` | Required\* | A CSS selector for the target element (e.g. `'[data-tour="export"]'`) |

> \* Provide EITHER `selectorId` or `selector`, but not both.

| `position` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Tooltip placement relative to the target |
| `width` | `number` | `undefined` | Override the spotlight width |
| `height` | `number` | `undefined` | Override the spotlight height |
| `padding` | `number` | `8` | Spotlight padding around the target element |
| `borderRadius` | `number` | `8` | Spotlight corner radius |
| `showSkip` | `boolean` | `true` | Whether to show the "Skip tour" button (hidden on last step regardless) |
| `closeable` | `boolean` | `undefined` | Override the provider-level `closeable` setting for this step |
| `onClickWithinArea` | `() => void` | `undefined` | Callback when the user clicks within the highlighted area |

### `TourDefinition`

Defines a named tour for use with the `tours` prop.

| Prop | Type | Description |
|------|------|-------------|
| `id` | `string` | Unique identifier for the tour |
| `steps` | `TourStep[]` | Array of steps in this tour |

### `TourProvider`

A context provider component that manages the tour state and functionality.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | Required | The child components to be wrapped by the provider |
| `tours` | `TourDefinition[]` | `undefined` | Array of named tour definitions |
| `onComplete` | `(tourId: string) => void` | `undefined` | Callback when a tour is completed |
| `onStart` | `(tourId: string) => void` | `undefined` | Callback when a tour starts |
| `onStepChange` | `(tourId: string, step: number) => void` | `undefined` | Callback when the active step changes |
| `onSkip` | `(tourId: string, step: number) => void` | `undefined` | Callback when a tour is skipped |
| `closeable` | `boolean` | `false` | Show a close (X) button on each tooltip |
| `className` | `string` | `undefined` | Additional CSS classes for the tour highlight border |
| `isTourCompleted` | `boolean` | `false` | Initial state of tour completion |

### `useTour`

A hook that provides access to the tour context and functionality. Must be used within a `TourProvider` component.

#### Returns

| Value | Type | Description |
|------|------|-------------|
| `currentStep` | `number` | Current step index (-1 when tour is inactive) |
| `totalSteps` | `number` | Total number of steps in the tour |
| `nextStep` | `() => void` | Function to advance to the next step |
| `previousStep` | `() => void` | Function to go back to the previous step |
| `endTour` | `() => void` | Function to end the tour |
| `isActive` | `boolean` | Whether the tour is currently active |
| `startTour` | `(tourId?: string) => void` | Function to start a tour (by ID if using multiple tours) |
| `setSteps` | `(steps: TourStep[]) => void` | Function to set tour steps (for single-tour usage) |
| `steps` | `TourStep[]` | Array of tour step configurations |
| `isTourCompleted` | `boolean` | Whether the tour has been completed |
| `setIsTourCompleted` | `(completed: boolean) => void` | Function to set tour completion status |
| `activeTourId` | `string \| null` | The ID of the currently active tour |

#### Usage
```tsx
const { startTour, currentStep, nextStep, activeTourId } = useTour();
```

### `TourAlertDialog`

A dialog component that prompts users to start or skip the tour.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Controls the visibility of the dialog |
| `setIsOpen` | `(isOpen: boolean) => void` | Callback to update the dialog's open state |
