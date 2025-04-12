// js/dashboard.js
import { getDatabase, ref, onChildAdded, onChildRemoved, remove, push, update } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const auth = getAuth();
const db = getDatabase();
let currentUserUid = null;

// Array of available icon filenames (for dynamic palette)
const availableIcons = [
  "cook.png", "kitchen.png", "sofa.png", "chair.png", "study.png",
  "bed.png", "lamp.png", "tv.png", "fan.png", "ac.png",
  "table.png", "window.png", "door.png", "book.png", "plant.png",
  "computer.png", "stove.png", "fridge.png", "oven.png", "microwave.png",
  "vacuum.png", "clock.png", "radio.png", "console.png", "shelf.png",
  "dining.png", "garage.png", "bath.png", "mirror.png", "curtain.png",
  "office.png", "podcast.png", "heater.png", "projector.png", "stereo.png",
  "printer.png", "router.png", "wireless.png", "basement.png", "attic.png",
  "porch.png", "balcony.png", "garden.png", "entry.png", "lobby.png"
];

const roomsContainer = document.getElementById("rooms-container");
const addRoomBtn = document.getElementById("add-room-btn");

// Modal elements for Room and Node creation/modification
const roomCreationModal = document.getElementById("roomCreationModal");
const closeRoomCreation = document.getElementById("closeRoomCreation");
const saveRoomBtn = document.getElementById("saveRoomBtn");
const newRoomNameInput = document.getElementById("newRoomName");
const roomIconPalette = document.getElementById("roomIconPalette");

const nodeCreationModal = document.getElementById("nodeCreationModal");
const closeNodeCreation = document.getElementById("closeNodeCreation");
const saveNodeBtn = document.getElementById("saveNodeBtn");
const newNodeNameInput = document.getElementById("newNodeName");
const nodeIconPalette = document.getElementById("nodeIconPalette");

const roomModal = document.getElementById("roomModal");
const closeRoomModal = document.getElementById("closeRoomModal");
const roomModalTitle = document.getElementById("roomModalTitle");
const roomModalNodesContainer = document.getElementById("roomModalNodesContainer");
const addNodeInRoomBtn = document.getElementById("addNodeInRoomBtn");

// Global variable to hold current room for node creation
let currentRoomKeyForNode = null;

// When authentication state changes, load profile and rooms
auth.onAuthStateChanged(user => {
  if (user) {
    currentUserUid = user.uid;
    loadUserProfile();
    loadRooms();
  } else {
    window.location.href = "login.html";
  }
});

// Load user's profile to display username on dashboard
function loadUserProfile() {
  const profileRef = ref(db, "users/" + currentUserUid + "/profile");
  onChildAdded(profileRef, snapshot => {
    if (snapshot.key === "username") {
      document.getElementById("displayName").textContent = snapshot.val();
    }
  });
}

// Load rooms from Firebase
function loadRooms() {
  const roomsRef = ref(db, "users/" + currentUserUid + "/rooms");
  onChildAdded(roomsRef, snapshot => {
    createRoomCard(snapshot.key, snapshot.val());
  });
  onChildRemoved(roomsRef, snapshot => {
    const roomCard = document.getElementById("room-" + snapshot.key);
    if (roomCard) roomCard.remove();
  });
}

// Create a room card element with click to open modal
function createRoomCard(roomKey, roomData) {
  const roomCard = document.createElement("div");
  roomCard.classList.add("room-card");
  roomCard.id = "room-" + roomKey;
  
  const header = document.createElement("h3");
  header.textContent = roomData.name;
  roomCard.appendChild(header);
  
  // Right-click to delete room
  roomCard.addEventListener("contextmenu", e => {
    e.preventDefault();
    if (confirm("Delete room '" + roomData.name + "'?")) {
      remove(ref(db, "users/" + currentUserUid + "/rooms/" + roomKey));
    }
  });
  
  // Click on room card to open room modal
  roomCard.addEventListener("click", e => {
    if (e.target.tagName.toLowerCase() !== "button") { // Ignore button clicks
      openRoomModal(roomKey, roomData);
    }
  });
  
  // Container for nodes
  const nodesContainer = document.createElement("div");
  nodesContainer.classList.add("nodes-container");
  roomCard.appendChild(nodesContainer);
  
  // Load nodes for this room
  const roomNodesRef = ref(db, "users/" + currentUserUid + "/rooms/" + roomKey + "/nodes");
  onChildAdded(roomNodesRef, snapshot => {
    addNodeItem(nodesContainer, roomKey, snapshot.key, snapshot.val());
  });
  onChildRemoved(roomNodesRef, snapshot => {
    const nodeElem = document.getElementById("node-" + roomKey + "-" + snapshot.key);
    if (nodeElem) nodeElem.remove();
  });
  
  // Button to add node from room card view (optional)
  const addNodeBtn = document.createElement("button");
  addNodeBtn.classList.add("add-node");
  addNodeBtn.textContent = "+ Add Node";
  addNodeBtn.onclick = e => {
    e.stopPropagation();
    openNodeCreationModal(roomKey);
  };
  roomCard.appendChild(addNodeBtn);
  
  roomsContainer.appendChild(roomCard);
}

// Create a node item element with a toggle button for on/off state
function addNodeItem(container, roomKey, nodeKey, nodeData) {
  const nodeItem = document.createElement("div");
  nodeItem.classList.add("node-item");
  nodeItem.id = "node-" + roomKey + "-" + nodeKey;
  
  // Options button for node actions
  const optionsBtn = document.createElement("button");
  optionsBtn.textContent = "⋮";
  optionsBtn.classList.add("node-options-btn");
  optionsBtn.onclick = function(e) {
    e.stopPropagation();
    showNodeOptions(roomKey, nodeKey, nodeData, nodeItem);
  };
  nodeItem.appendChild(optionsBtn);
  
  // Icon
  const iconImg = document.createElement("img");
  iconImg.src = "assets/images/" + nodeData.icon;
  iconImg.alt = nodeData.name;
  nodeItem.appendChild(iconImg);
  
  // Node name
  const nodeLabel = document.createElement("span");
  nodeLabel.textContent = nodeData.name;
  nodeItem.appendChild(nodeLabel);
  
  // Toggle button to turn node on/off
  const toggleBtn = document.createElement("button");
  toggleBtn.classList.add("node-toggle-btn");
  toggleBtn.textContent = nodeData.state === "ON" ? "ON" : "OFF";
  toggleBtn.onclick = e => {
    e.stopPropagation();
    const newState = toggleBtn.textContent === "ON" ? "OFF" : "ON";
    update(ref(db, "users/" + currentUserUid + "/rooms/" + roomKey + "/nodes/" + nodeKey), { state: newState });
  };
  nodeItem.appendChild(toggleBtn);
  
  // Listen for state changes (optional: if real-time updates are implemented)
  // For now, we assume the update call is sufficient.
  
  container.appendChild(nodeItem);
}

// Show node options using a prompt; can be replaced by a custom modal later.
function showNodeOptions(roomKey, nodeKey, nodeData, nodeItem) {
  const action = prompt("Enter action: (delete, duplicate, modify, pin)", "delete");
  if (action === "delete") {
    remove(ref(db, "users/" + currentUserUid + "/rooms/" + roomKey + "/nodes/" + nodeKey));
  } else if (action === "duplicate") {
    push(ref(db, "users/" + currentUserUid + "/rooms/" + roomKey + "/nodes"), nodeData);
  } else if (action === "modify") {
    const newName = prompt("Enter new name:", nodeData.name);
    if (newName) {
      update(ref(db, "users/" + currentUserUid + "/rooms/" + roomKey + "/nodes/" + nodeKey), { name: newName });
    }
  } else if (action === "pin") {
    console.log("Node pinned:", nodeData);
    alert("Node pinned! (This will add the node to the top bar later.)");
  }
}

// Open the room creation modal and build its icon palette dynamically
function openRoomCreationModal() {
  roomCreationModal.style.display = "block";
  newRoomNameInput.value = "";
  roomIconPalette.innerHTML = "";
  
  availableIcons.forEach(icon => {
    const img = document.createElement("img");
    img.src = "assets/images/" + icon;
    img.alt = icon;
    img.classList.add("icon-option");
    img.addEventListener("click", () => {
      document.querySelectorAll("#roomIconPalette img").forEach(i => i.classList.remove("selected"));
      img.classList.add("selected");
    });
    roomIconPalette.appendChild(img);
  });
}

// Save new room from the room creation modal
saveRoomBtn.addEventListener("click", () => {
  const roomName = newRoomNameInput.value.trim();
  const selectedIconEl = document.querySelector("#roomIconPalette img.selected");
  if (!roomName) {
    alert("Please enter a room name.");
    return;
  }
  const roomIcon = selectedIconEl ? selectedIconEl.alt : "default_room.png";
  push(ref(db, "users/" + currentUserUid + "/rooms"), { name: roomName, icon: roomIcon });
  roomCreationModal.style.display = "none";
});

// Open the node creation modal for a specific room
function openNodeCreationModal(roomKey) {
  currentRoomKeyForNode = roomKey;
  nodeCreationModal.style.display = "block";
  newNodeNameInput.value = "";
  nodeIconPalette.innerHTML = "";
  
  availableIcons.forEach(icon => {
    const img = document.createElement("img");
    img.src = "assets/images/" + icon;
    img.alt = icon;
    img.classList.add("icon-option");
    img.addEventListener("click", () => {
      document.querySelectorAll("#nodeIconPalette img").forEach(i => i.classList.remove("selected"));
      img.classList.add("selected");
    });
    nodeIconPalette.appendChild(img);
  });
  
  // In the node creation modal, we add a provision link.
  const provisionLink = document.createElement("a");
  provisionLink.href = "http://192.168.4.1";  // Static IP for provisioning page; replace if needed.
  provisionLink.target = "_blank";
  provisionLink.textContent = "Keep your device powered on and click here to provision it";
  provisionLink.classList.add("provision-link");
  // Remove existing provision link if any, then add
  const existingLink = document.getElementById("provisionLink");
  if (existingLink) existingLink.remove();
  provisionLink.id = "provisionLink";
  nodeIconPalette.parentNode.appendChild(provisionLink);
}

// Save new node from the node creation modal
saveNodeBtn.addEventListener("click", () => {
  const nodeName = newNodeNameInput.value.trim();
  const selectedIconEl = document.querySelector("#nodeIconPalette img.selected");
  if (!nodeName) {
    alert("Please enter a node name.");
    return;
  }
  const nodeIcon = selectedIconEl ? selectedIconEl.alt : "default_node.png";
  // Set initial state to OFF
  push(ref(db, "users/" + currentUserUid + "/rooms/" + currentRoomKeyForNode + "/nodes"), { name: nodeName, icon: nodeIcon, state: "OFF" });
  nodeCreationModal.style.display = "none";
});

// Open the room modal for displaying room details and its nodes
function openRoomModal(roomKey, roomData) {
  roomModal.style.display = "block";
  roomModalTitle.textContent = roomData.name;
  roomModalNodesContainer.innerHTML = "";
  currentRoomKeyForNode = roomKey;
  const roomNodesRef = ref(db, "users/" + currentUserUid + "/rooms/" + roomKey + "/nodes");
  onChildAdded(roomNodesRef, snapshot => {
    addNodeItem(roomModalNodesContainer, roomKey, snapshot.key, snapshot.val());
  });
}

// Modal close events
closeRoomCreation.onclick = () => { roomCreationModal.style.display = "none"; }
closeNodeCreation.onclick = () => { nodeCreationModal.style.display = "none"; }
closeRoomModal.onclick = () => { roomModal.style.display = "none"; }

// Close modals when clicking outside of them
window.onclick = (event) => {
  if (event.target === roomCreationModal) roomCreationModal.style.display = "none";
  if (event.target === nodeCreationModal) nodeCreationModal.style.display = "none";
  if (event.target === roomModal) roomModal.style.display = "none";
};

// Event listeners for modal triggers
addRoomBtn.addEventListener("click", openRoomCreationModal);
addNodeInRoomBtn.addEventListener("click", () => { openNodeCreationModal(currentRoomKeyForNode); });
