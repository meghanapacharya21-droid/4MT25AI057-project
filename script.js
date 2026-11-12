// ==========================================
// SMART TIMETABLE PLANNER
// ==========================================

// Demo subject data for Semester 3.
// This is not a complete, verified MITE syllabus.
// Add missing subjects using the custom subject option.

const subjectDatabase = {
    "AIML-3": [
        "Data Structures and Algorithms",
        "Computer Organization",
        "Discrete Mathematics",
        "Object Oriented Programming",
        "Digital Design",
        "Environmental Studies"
    ],
    "CSE-3": [
        "Data Structures and Algorithms",
        "Computer Organization",
        "Discrete Mathematics",
        "Object Oriented Programming"
    ],
    "ISE-3": [
        "Data Structures and Algorithms",
        "Computer Organization",
        "Discrete Mathematics"
    ],
    "ECE-3": [
        "Digital Electronics",
        "Electronic Devices",
        "Signals and Systems"
    ],
    "ME-3": [
        "Engineering Mechanics",
        "Thermodynamics",
        "Material Science"
    ],
    "CIVIL-3": [
        "Surveying",
        "Building Materials",
        "Fluid Mechanics"
    ]
};

let availableSubjects = [];
let selectedSubjects = [];
let tasks = [];
let timetable = [];
let nextTaskId = 1;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getElement(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };
        return replacements[character];
    });
}

function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;

    return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

function showMessage(message) {
    alert(message);
}

// ==========================================
// SET MINIMUM DEADLINE TO TODAY
// ==========================================

getElement("deadline").min = localDateString(new Date());

// ==========================================
// LOAD SUBJECTS
// ==========================================

function loadSubjects() {
    const branch = getElement("branch").value;
    const semester = getElement("semester").value;
    const key = `${branch}-${semester}`;

    availableSubjects = subjectDatabase[key]
        ? [...subjectDatabase[key]]
        : [];

    selectedSubjects = [];

    displaySubjects();
    updateSubjectDropdown();

    if (availableSubjects.length === 0) {
        getElement("subjectList").innerHTML =
            `<p class="help-text">
                Demo subjects are not available for this branch and semester.
                Please add your subjects using the custom subject option.
            </p>`;
    }
}

function displaySubjects() {
    const container = getElement("subjectList");

    if (availableSubjects.length === 0) {
        container.innerHTML =
            `<p class="help-text">No demo subjects available. Add a subject below.</p>`;
        return;
    }

    container.innerHTML = availableSubjects.map((subject, index) => `
        <label class="subject-option">
            <input
                type="checkbox"
                class="subject-checkbox"
                value="${escapeHTML(subject)}"
                id="subject-${index}"
            >
            <span>${escapeHTML(subject)}</span>
        </label>
    `).join("");

    document.querySelectorAll(".subject-checkbox").forEach(checkbox => {
        checkbox.addEventListener("change", function () {
            const subject = this.value;

            if (this.checked && !selectedSubjects.includes(subject)) {
                selectedSubjects.push(subject);
            } else {
                selectedSubjects = selectedSubjects.filter(
                    item => item !== subject
                );
            }

            updateSubjectDropdown();
        });
    });
}

// ==========================================
// ADD CUSTOM SUBJECT
// ==========================================

function addCustomSubject() {
    const input = getElement("customSubject");
    const subject = input.value.trim();

    if (!subject) {
        showMessage("Please enter a subject name.");
        return;
    }

    if (availableSubjects.some(
        item => item.toLowerCase() === subject.toLowerCase()
    )) {
        showMessage("This subject already exists.");
        return;
    }

    availableSubjects.push(subject);
    selectedSubjects.push(subject);

    displaySubjects();
    updateSubjectDropdown();

    // Check the newly added subject.
    const checkboxes = document.querySelectorAll(".subject-checkbox");
    checkboxes[checkboxes.length - 1].checked = true;

    input.value = "";
}

// ==========================================
// UPDATE TASK SUBJECT DROPDOWN
// ==========================================

function updateSubjectDropdown() {
    const dropdown = getElement("taskSubject");

    dropdown.innerHTML = `<option value="">Select a subject</option>`;

    selectedSubjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;
        dropdown.appendChild(option);
    });
}

// ==========================================
// ADD TASK
// ==========================================

function addTask() {
    const subject = getElement("taskSubject").value;
    const type = getElement("taskType").value;
    const name = getElement("taskName").value.trim();
    const deadline = getElement("deadline").value;
    const hours = Number(getElement("taskHours").value);
    const completion = Number(getElement("completion").value);
    const difficulty = Number(getElement("difficulty").value);

    if (!subject) {
        showMessage("Please select a subject.");
        return;
    }

    if (!name) {
        showMessage("Please enter the task or topic name.");
        return;
    }

    if (!deadline) {
        showMessage("Please select a deadline.");
        return;
    }

    if (deadline < localDateString(new Date())) {
        showMessage("Deadline cannot be in the past.");
        return;
    }

    if (!Number.isFinite(hours) || hours <= 0) {
        showMessage("Enter remaining work hours greater than zero.");
        return;
    }

    if (!Number.isFinite(completion) || completion < 0 || completion > 100) {
        showMessage("Completion must be between 0 and 100.");
        return;
    }

    tasks.push({
        id: nextTaskId++,
        subject,
        type,
        name,
        deadline,
        hours,
        completion,
        difficulty,
        remainingMinutes: Math.round(hours * 60)
    });

    getElement("taskName").value = "";
    getElement("taskHours").value = "2";
    getElement("completion").value = "0";

    displayTasks();
    displayDeadlineAlerts();

    // Clear old timetable because the task list has changed.
    timetable = [];
    getElement("timetable").innerHTML =
        `<p class="help-text">Generate your timetable again to include the new task.</p>`;

    getElement("progressSection").innerHTML =
        `<p class="help-text">Generate your timetable to see your progress here.</p>`;
}

// ==========================================
// DISPLAY TASKS
// ==========================================

function displayTasks() {
    const container = getElement("taskList");

    if (tasks.length === 0) {
        container.innerHTML =
            `<p class="help-text">Your tasks will appear here.</p>`;
        return;
    }

    container.innerHTML = tasks.map(task => `
        <div class="task-item">
            <strong>${escapeHTML(task.name)}</strong>
            <p>Subject: ${escapeHTML(task.subject)}</p>
            <p>Task type: ${escapeHTML(task.type)}</p>
            <p class="deadline-text">Deadline: ${formatDate(task.deadline)}</p>
            <p>Remaining work: ${task.hours} hours</p>
            <p>Already completed: ${task.completion}%</p>
            <p>Difficulty: ${
                ["", "Easy", "Medium", "Difficult"][task.difficulty]
            }</p>
            <button class="delete-btn" onclick="deleteTask(${task.id})">
                Delete Task
            </button>
        </div>
    `).join("");
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);

    displayTasks();
    displayDeadlineAlerts();

    timetable = [];

    getElement("timetable").innerHTML =
        `<p class="help-text">Generate your timetable again.</p>`;

    getElement("progressSection").innerHTML =
        `<p class="help-text">Generate your timetable to see your progress here.</p>`;
}

// ==========================================
// DEADLINE ALERTS
// ==========================================

function displayDeadlineAlerts() {
    const container = getElement("deadlineAlerts");

    if (tasks.length === 0) {
        container.innerHTML =
            `<p class="help-text">Add tasks to see deadline alerts.</p>`;
        return;
    }

    const today = localDateString(new Date());

    const sortedTasks = [...tasks].sort((a, b) =>
        a.deadline.localeCompare(b.deadline)
    );

    container.innerHTML = sortedTasks.map(task => {
        const daysLeft = Math.round(
            (new Date(task.deadline + "T00:00:00") -
            new Date(today + "T00:00:00")) / 86400000
        );

        let message;

        if (daysLeft === 0) {
            message = "Due today!";
        } else if (daysLeft === 1) {
            message = "Due tomorrow!";
        } else if (daysLeft <= 3) {
            message = `Due in ${daysLeft} days!`;
        } else {
            message = `Due on ${formatDate(task.deadline)}`;
        }

        return `
            <div class="alert-item">
                <strong>${escapeHTML(message)}</strong>
                <p>${escapeHTML(task.name)} — ${escapeHTML(task.subject)}</p>
                <p>Deadline: <strong>${formatDate(task.deadline)}</strong></p>
            </div>
        `;
    }).join("");
}

// ==========================================
// GENERATE STUDY TIME SLOTS
// ==========================================

function createDailySlots() {
    const startValue = getElement("studyStart").value;
    const endValue = getElement("studyEnd").value;

    const sessionDuration = Number(getElement("sessionDuration").value);
    const breakDuration = Number(getElement("breakDuration").value);

    if (!startValue || !endValue) {
        showMessage("Please select your study start and end times.");
        return null;
    }

    const [startHour, startMinute] = startValue.split(":").map(Number);
    const [endHour, endMinute] = endValue.split(":").map(Number);

    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;

    if (end <= start) {
        showMessage("Study end time must be later than start time on the same day.");
        return null;
    }

    if (!Number.isFinite(sessionDuration) || sessionDuration < 15) {
        showMessage("Study sessions must be at least 15 minutes.");
        return null;
    }

    if (!Number.isFinite(breakDuration) || breakDuration < 0) {
        showMessage("Break duration cannot be negative.");
        return null;
    }

    const slots = [];
    let current = start;

    while (current + sessionDuration <= end) {
        slots.push({
            start: current,
            end: current + sessionDuration
        });

        current += sessionDuration + breakDuration;
    }

    if (slots.length === 0) {
        showMessage("There is not enough time for one study session.");
        return null;
    }

    return slots;
}

// ==========================================
// GENERATE TIMETABLE
// ==========================================

function generateTimetable() {
    if (tasks.length === 0) {
        showMessage("Please add at least one task.");
        return;
    }

    const dailySlots = createDailySlots();

    if (!dailySlots) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestDeadline = tasks.reduce((latest, task) => {
        const date = new Date(task.deadline + "T00:00:00");
        return date > latest ? date : latest;
    }, today);

    const numberOfDays = Math.floor(
        (latestDeadline - today) / 86400000
    ) + 1;

    if (numberOfDays > 180) {
        showMessage("Please use deadlines within the next 180 days.");
        return;
    }

    // Make a fresh working copy every time timetable is generated.
    const workingTasks = tasks.map(task => ({
        ...task,
        remaining: Math.round(task.hours * 60),
        allocated: 0
    }));

    timetable = [];

    for (let dayIndex = 0; dayIndex < numberOfDays; dayIndex++) {
        const date = new Date(today);
        date.setDate(today.getDate() + dayIndex);

        const dateString = localDateString(date);

        const day = {
            date: dateString,
            sessions: []
        };

        dailySlots.forEach((slot, slotIndex) => {
            const eligibleTasks = workingTasks
                .filter(task =>
                    task.remaining > 0 &&
                    task.deadline >= dateString
                )
                .sort((a, b) => {
                    // Earlier deadlines first.
                    if (a.deadline !== b.deadline) {
                        return a.deadline.localeCompare(b.deadline);
                    }

                    // More difficult tasks first.
                    if (a.difficulty !== b.difficulty) {
                        return b.difficulty - a.difficulty;
                    }

                    // Spread work across tasks with the same deadline.
                    const ratioA = a.allocated / (a.hours * 60);
                    const ratioB = b.allocated / (b.hours * 60);

                    return ratioA - ratioB;
                });

            if (eligibleTasks.length === 0) {
                day.sessions.push(null);
                return;
            }

            const chosenTask = eligibleTasks[0];
            const duration = Math.min(
                slot.end - slot.start,
                chosenTask.remaining
            );

            const session = {
                id: `${dateString}-${slotIndex}-${chosenTask.id}`,
                taskId: chosenTask.id,
                subject: chosenTask.subject,
                type: chosenTask.type,
                name: chosenTask.name,
                start: slot.start,
                end: slot.start + duration,
                completed: false
            };

            day.sessions.push(session);

            chosenTask.remaining -= duration;
            chosenTask.allocated += duration;
        });

        timetable.push(day);
    }

    displayTimetable();
    displayProgress();
    displayDeadlineAlerts();

    const unscheduled = workingTasks.filter(task => task.remaining > 0);

    if (unscheduled.length > 0) {
        const names = unscheduled.map(task =>
            `${task.name} (${(task.remaining / 60).toFixed(1)} hours left)`
        ).join("\n");

        showMessage(
            "Your timetable was generated, but some work could not fit before its deadline:\n\n" +
            names +
            "\n\nTry increasing your daily study time or changing the deadlines."
        );
    }
}

// ==========================================
// DISPLAY TIMETABLE
// ==========================================

function displayTimetable() {
    const container = getElement("timetable");

    if (timetable.length === 0) {
        container.innerHTML =
            `<p class="help-text">No timetable available.</p>`;
        return;
    }

    const slotCount = timetable[0].sessions.length;

    let html = `
        <div class="table-wrapper">
        <table>
            <thead>
                <tr>
                    <th class="time-heading">Study Time</th>
    `;

    timetable.forEach(day => {
        const dayName = new Date(day.date + "T00:00:00")
            .toLocaleDateString("en-IN", { weekday: "short" });

        const hasDeadline = tasks.some(task => task.deadline === day.date);

        html += `
            <th class="${hasDeadline ? "deadline-day" : ""}">
                ${dayName}<br>
                ${formatDate(day.date)}
                ${hasDeadline ? "<br>DEADLINE" : ""}
            </th>
        `;
    });

    html += `
                </tr>
            </thead>
            <tbody>
    `;

    for (let slotIndex = 0; slotIndex < slotCount; slotIndex++) {
        const start = timetable[0].sessions[slotIndex]
            ? timetable[0].sessions[slotIndex].start
            : getSlotStart(slotIndex);

        const end = getSlotEnd(slotIndex);

        html += `
            <tr>
                <td class="time-cell">
                    ${minutesToTime(start)}<br>
                    to<br>
                    ${minutesToTime(end)}
                </td>
        `;

        timetable.forEach(day => {
            const session = day.sessions[slotIndex];

            if (!session) {
                html += `<td class="empty-slot">Free time</td>`;
                return;
            }

            html += `
                <td>
                    <div class="session ${session.completed ? "completed" : ""}">
                        <strong>${escapeHTML(session.subject)}</strong><br>
                        ${escapeHTML(session.type)}<br>
                        ${escapeHTML(session.name)}<br>
                        <small>
                            ${minutesToTime(session.start)}
                            - ${minutesToTime(session.end)}
                        </small><br><br>
                        <label>
                            <input
                                type="checkbox"
                                class="session-checkbox"
                                data-session-id="${escapeHTML(session.id)}"
                                ${session.completed ? "checked" : ""}
                            >
                            Completed
                        </label>
                    </div>
                </td>
            `;
        });

        html += `</tr>`;
    }

    html += `
            </tbody>
        </table>
        </div>
    `;

    container.innerHTML = html;

    document.querySelectorAll(".session-checkbox").forEach(checkbox => {
        checkbox.addEventListener("change", function () {
            const sessionId = this.dataset.sessionId;

            timetable.forEach(day => {
                day.sessions.forEach(session => {
                    if (session && session.id === sessionId) {
                        session.completed = this.checked;
                    }
                });
            });

            const sessionBox = this.closest(".session");

            if (sessionBox) {
                sessionBox.classList.toggle("completed", this.checked);
            }

            displayProgress();
        });
    });
}

// These functions keep the time labels aligned even when a session
// is shorter than the selected session duration.

function getSlotStart(slotIndex) {
    const [hour, minute] = getElement("studyStart").value.split(":").map(Number);
    const session = Numbe
   

       



   

    
            
    

   


       

    


   

           

    
    


   
                
        
    
            
                    
           


      

        
