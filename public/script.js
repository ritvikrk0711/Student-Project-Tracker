
const form = document.querySelector("#project-form");
const nameInput = document.querySelector("#name");
const statusInput = document.querySelector("#status");
const projectList = document.querySelector("#project-list");
const emptyState = document.querySelector("#empty-state");
const saveButton = document.querySelector("#save-button");
const cancelButton = document.querySelector("#cancel-button");
const message = document.querySelector("#message");

const STORAGE_KEY = "workshop-projects-v1";

// Projects are loaded from browser storage when possible.
let projects = [];
let nextId = 1;
let editingId = null;
let storageReady = true;

// Display a message to the user.
function showMessage(text) {
  if (message) {
    message.textContent = text;
  }
}

// Check that stored data has the expected project structure.
function isValidProjects(data) {
  if (!Array.isArray(data)) {
    return false;
  }

  const ids = new Set();

  return data.every(function (project) {
    if (
      project === null ||
      typeof project !== "object" ||
      !Number.isSafeInteger(project.id) ||
      project.id < 1 ||
      typeof project.name !== "string" ||
      project.name.trim() === "" ||
      project.name.length > 80 ||
      !["Planned", "In Progress", "Completed"].includes(project.status) ||
      ids.has(project.id)
    ) {
      return false;
    }

    ids.add(project.id);
    return true;
  });
}

// Load projects from browser storage.
function loadProjects() {
  let savedText;

  try {
    savedText = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    storageReady = false;
    showMessage(
      "Projects could not be read from browser storage. Changes cannot be saved."
    );
    return;
  }

  // No saved collection means this is a new, empty tracker.
  if (savedText === null) {
    projects = [];
    return;
  }

  let savedProjects;

  try {
    // JSON.parse turns stored text back into a JavaScript value.
    savedProjects = JSON.parse(savedText);
  } catch (error) {
    storageReady = false;
    showMessage(
      "Saved project data is invalid JSON. It has not been overwritten. Changes cannot be saved."
    );
    return;
  }

  if (!isValidProjects(savedProjects)) {
    storageReady = false;
    showMessage(
      "Saved project data has an invalid format. It has not been overwritten. Changes cannot be saved."
    );
    return;
  }

  projects = savedProjects;

  // Continue assigning IDs above the largest restored ID.
  nextId = projects.reduce(function (largest, project) {
    return Math.max(largest, project.id);
  }, 0) + 1;
}

// Save the current collection.
function saveProjects(successMessage) {
  if (!storageReady) {
    showMessage(
      "Changes could not be saved. The existing stored data has been preserved."
    );
    return false;
  }

  try {
    // JSON.stringify turns our collection into text.
    const savedText = JSON.stringify(projects);
    localStorage.setItem(STORAGE_KEY, savedText);

    showMessage(successMessage);
    return true;
  } catch (error) {
    showMessage(
      "Changes could not be saved to browser storage. They remain only in memory for this session."
    );
    return false;
  }
}

// Return the form to Add mode.
function resetForm() {
  form.reset();
  editingId = null;
  saveButton.textContent = "Save Project";
  cancelButton.hidden = true;
}

// Display all projects.
function renderProjects() {
  projectList.replaceChildren();

  if (emptyState) {
    emptyState.hidden = projects.length > 0;
  }

  projects.forEach(function (project) {
    const listItem = document.createElement("li");
    const projectName = document.createElement("span");
    const projectStatus = document.createElement("span");
    const editButton = document.createElement("button");
    const deleteButton = document.createElement("button");

    projectName.textContent = project.name;
    projectStatus.textContent = " — " + project.status;

    // Edit button.
    editButton.type = "button";
    editButton.textContent = "Edit";

    editButton.addEventListener("click", function () {
      editingId = project.id;

      nameInput.value = project.name;
      statusInput.value = project.status;

      saveButton.textContent = "Save changes";
      cancelButton.hidden = false;

      showMessage("Editing project: " + project.name);
      nameInput.focus();
    });

    // Delete button.
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.dataset.projectId = String(project.id);

    deleteButton.addEventListener("click", function () {
      const confirmed = window.confirm(
        'Are you sure you want to delete "' + project.name + '"?'
      );

      // Cancel leaves the collection and stored data unchanged.
      if (!confirmed) {
        return;
      }

      // Identify the project by its stable ID.
      const projectIndex = projects.findIndex(function (item) {
        return item.id === project.id;
      });

      if (projectIndex === -1) {
        return;
      }

      // If this project is being edited, return to Add mode.
      if (editingId === project.id) {
        resetForm();
      }

      projects.splice(projectIndex, 1);

      renderProjects();
      saveProjects("Project deleted successfully.");
    });

    listItem.append(
      projectName,
      projectStatus,
      document.createTextNode(" "),
      editButton,
      document.createTextNode(" "),
      deleteButton
    );

    projectList.appendChild(listItem);
  });
}

// Handle adding and editing with one submit listener.
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const status = statusInput.value;

  if (name === "") {
    nameInput.setCustomValidity("Please enter a project name.");
    nameInput.reportValidity();
    nameInput.setCustomValidity("");
    nameInput.focus();
    return;
  }

  if (editingId !== null) {
    // Find and update the existing project by ID.
    const project = projects.find(function (item) {
      return item.id === editingId;
    });

    if (!project) {
      showMessage("Project not found. Please try again.");
      resetForm();
      renderProjects();
      return;
    }

    project.name = name;
    project.status = status;

    resetForm();
    renderProjects();
    saveProjects("Project updated successfully.");
  } else {
    // Create a new project with a unique, stable ID.
    projects.push({
      id: nextId,
      name: name,
      status: status
    });

    nextId += 1;

    resetForm();
    renderProjects();
    saveProjects("Project added successfully.");
  }
});

// Cancel editing without changing stored projects.
cancelButton.addEventListener("click", function () {
  resetForm();
  showMessage("Edit cancelled.");
});

// Load saved data and display the initial list.
loadProjects();
resetForm();
renderProjects();
