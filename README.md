<!-- @format -->

# Slotted

An app for teachers to plan their lessons in certain time slots.

## To-do

## Change Log

### 2025/12/13

-   UX: added a toast to the app to inform the user when the browser zoom level changes
-   UX: added zoom level settings in the settings page
-   UX: slots can now be edited for the viewed week only
-   BUG: the viewed slot is now correctly disabled instead of the current week's slot only

### 2025/11/11

-   BUG: time slot action menu now correctly appears even when there are no classes in the slot
-   UX: the time slot action menu now has a delete button
-   UX: at the day area, there is an option to quickly disable an entire day's slots, for instance because the day might be off or something like that
-   UX: when adding the same class to a time slot in the current view, it should copy the text from the one that is already in the view
-   UX: in the side bar, the class action menu no longer has a white background on hover, instead it has the same bg on hover as the one that is present when inside a time slot
-   UX: in the sidebar, when a class has been added to a timeslot in the current view, it now has opacity-30 or some other way to indicate it's already in the current view
-   UI: in the display mode, replaced the emoji with the checkmark icon if done
-   UX: added keyboard shortcuts in the display dialog: edit mode, save, mark/unmark complete
-   UX: when creating a timetable, can now optionally copy classes from another timetable

### 2025/11/10

-   UX: moved the check mark when a class is complete to the left of the class name
-   UX: when the add a class dropdown is open, only the hovered class has opacity-100, the others now have opacity-50 or so
-   UX: in the sidebar, when it's collapsed, the dropdown menu for the classes now is positioned on the right
-   BUG: the action menu now properly appears on hover
-   BUG: the create class dialog now has a scroll area
-   UX: added time slot duration in parentheses next to the time in the time slot header which can be enabled or disabled in settings
-   UX: removed "Create" from the buttons in the navbar
-   UX: in the sidebar, when a class has been added to a timeslot in the current view, it now has opacity-50

### 2025/11/09 12:48

-   added checkmark on completed classes
-   created display dialog with edit mode
-   added bgColor and textColor to classes
-   when sidebar is collapsed, the class icons render properly and clicking one opens the class action menu
-   day view now renders classes within time slots correctly

### 2025/11/09 09:52

-   time slots appear in UI now

### 2025/11/09 08:52

-   on mobile, make sure the class action menu is always visible
-   change the dialogs to be responsive dialog, like in viziers-vault-app
-   on mobile, the sidebar now auto collapses when a timetable is selected
-   added a favicon so I can get the install option on Android
-   class icons render properly when sidebar is collapsed
-   icon picker is now scrollable on mobile via touch

### 2025/11/08

-   timetables done
-   can add classes now
-   added lucide icon picker to timetables and classes
