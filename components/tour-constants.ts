const step = (id: string) => ({
  id,
  selector: `[data-tour="${id}"]`,
});

export const TOUR_STEPS = {
  TEAM_SWITCHER: step("team-switcher"),
  WRITING_AREA: step("writing-area"),
  ASK_AI: step("ask-ai"),
  FAVORITES: step("favorites"),
};
