// A deliberately small feature so the governance/evidence loop stays visible.
export function pendingTitles(tasks) {
  return tasks.filter(task => !task.done).map(task => task.title)
}
