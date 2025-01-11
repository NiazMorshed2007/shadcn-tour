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
  {
    content: <div>Ask AI</div>,
    selectorId: TOUR_STEP_IDS.ASK_AI,
    position: "bottom",
    onClickWithinArea: () => { },
  },
  {
    content: <div>Quicly access your favorite pages</div>,
    selectorId: TOUR_STEP_IDS.FAVORITES,
    position: "right",
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

4. Remember to add the step ids to the selectors you want to highlight. Here is an example of how to do it:

```tsx
<div id={TOUR_STEP_IDS.TEAM_SWITCHER}>Team Switcher</div>
```


## API Reference

### `TourProvider`

A context provider component that manages the tour state and functionality.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | Required | The child components to be wrapped by the provider |
| `onComplete` | `() => void` | `undefined` | Callback function called when the tour is completed |
| `className` | `string` | `undefined` | Additional CSS classes for the tour highlight border |
| `isTourCompleted` | `boolean` | `false` | Initial state of tour completion |

### `useTour`

A hook that provides access to the tour context and functionality. Must be used within a `TourProvider` component.

#### Returns
All values provided by the tour context:

| Value | Type | Description |
|------|------|-------------|
| `currentStep` | `number` | Current step index (-1 when tour is inactive) |
| `totalSteps` | `number` | Total number of steps in the tour |
| `nextStep` | `() => void` | Function to advance to the next step |
| `previousStep` | `() => void` | Function to go back to the previous step |
| `endTour` | `() => void` | Function to end the tour |
| `isActive` | `boolean` | Whether the tour is currently active |
| `startTour` | `() => void` | Function to start the tour |
| `setSteps` | `(steps: TourStep[]) => void` | Function to set tour steps |
| `steps` | `TourStep[]` | Array of tour step configurations |
| `isTourCompleted` | `boolean` | Whether the tour has been completed |
| `setIsTourCompleted` | `(completed: boolean) => void` | Function to set tour completion status |

#### Usage
```tsx
const { startTour, currentStep, nextStep } = useTour();
```

### `TourAlertDialog`

A dialog component that prompts users to start or skip the tour.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Controls the visibility of the dialog |
| `setIsOpen` | `(isOpen: boolean) => void` | Callback to update the dialog's open state |
