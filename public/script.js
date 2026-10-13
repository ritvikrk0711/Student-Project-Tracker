const form = document.querySelector("#project-form");
const nameInput = document.querySelector("#name");
const statusInput = document.querySelector("#status");
const projectList = document.querySelector("#project-list");
const emptyState = document.querySelector("#empty-state");

const projects = [];
let nextId = 1;

function renderProjects() {
  projectList.replaceChildren();

  if (emptyState) {
    emptyState.hidden = projects.length > 0;
  }

  projects.forEach(function (project) {
    const listItem = document.createElement("li");
    const projectName = document.createElement("span");
    const projectStatus = document.createElement("span");

    projectName.textContent = project.name;
    projectStatus.textContent = " — " + project.status;

    listItem.append(projectName, projectStatus);
    projectList.appendChild(listItem);
  });
}

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

  const project = {
    id: nextId,
    name: name,
    status: status
  };

  projects.push(project);
  nextId += 1;

  renderProjects();
  form.reset();
});

renderProjects();