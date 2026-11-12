
import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../../firebase/firebase";
import { uploadToCloudinary } from "../../../firebase/cloudinary";
import "./ProjectsManager.css";

const initialForm = {
  title: "",
  description: "",
  category: "",
  imageUrl: "",
  imagePublicId: "",
  projectUrl: "",
  status: "Published",
};

function ProjectsManager() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Reads data; the first state update happens after the await.
  const loadProjects = async () => {
    try {

      const snapshot = await getDocs(collection(db, "projects"));

      setProjects(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );
    } catch (err) {
      console.error("Projects fetch error:", err);
      setError(err.message || "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  };

  // Used after save/delete: show the loader, then reload.
  const fetchProjects = async () => {
    setLoading(true);
    setError("");
    await loadProjects();
  };

  useEffect(() => {
    // Start the first load in a microtask so the effect itself sets no state.
    Promise.resolve().then(loadProjects);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size should be below 10 MB.");
      return;
    }

    setSelectedImage(file);
    setError("");
    setSuccess("");
  };

  const resetForm = () => {
    setForm(initialForm);
    setSelectedImage(null);
    setEditingId(null);
    setImageInputKey((previous) => previous + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.category.trim()) {
      setError("Please enter project title and category.");
      return;
    }

    const trimmedProjectUrl = form.projectUrl.trim();

    if (trimmedProjectUrl && !trimmedProjectUrl.toLowerCase().startsWith("https://")) {
      setError("Project URL must start with https://");
      return;
    }

    if (!form.imageUrl && !selectedImage) {
      setError("Please select a project thumbnail image.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      let imageUrl = form.imageUrl;
      let imagePublicId = form.imagePublicId;

      // Automatically upload selected image before saving.
      if (selectedImage) {
        setUploadingImage(true);

        const result = await uploadToCloudinary(
          selectedImage,
          "image"
        );

        imageUrl = result.url;
        imagePublicId = result.publicId;

        setUploadingImage(false);
      }

      const projectData = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        imageUrl,
        imagePublicId,
        projectUrl: trimmedProjectUrl,
        status: form.status,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(
          doc(db, "projects", editingId),
          projectData
        );
      } else {
        await addDoc(collection(db, "projects"), {
          ...projectData,
          createdAt: serverTimestamp(),
        });
      }

      resetForm();

      setSuccess(
        editingId
          ? "Project updated successfully!"
          : "Project added successfully!"
      );

      await fetchProjects();
    } catch (err) {
      console.error("Project save error:", err);
      setError(err.message || "Unable to save project.");
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const handleEdit = (project) => {
    setForm({
      title: project.title || "",
      description: project.description || "",
      category: project.category || "",
      imageUrl: project.imageUrl || "",
      imagePublicId: project.imagePublicId || "",
      projectUrl: project.projectUrl || "",
      status: project.status || "Published",
    });

    setSelectedImage(null);
    setImageInputKey((previous) => previous + 1);
    setEditingId(project.id);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteDoc(doc(db, "projects", id));

      setProjects((previous) =>
        previous.filter((project) => project.id !== id)
      );

      if (editingId === id) {
        resetForm();
      }

      setSuccess("Project deleted successfully!");
    } catch (err) {
      console.error("Project delete error:", err);
      setError(err.message || "Unable to delete project.");
    }
  };

  const handleCancel = () => {
    resetForm();
    setError("");
    setSuccess("");
  };

  return (
    <div className="projects-manager">
      <div className="projects-header">
        <div>
          <span className="projects-eyebrow">
            PORTFOLIO MANAGEMENT
          </span>
          <h1>Projects</h1>
          <p>Manage and showcase creative projects.</p>
        </div>

        <div className="projects-count">
          <strong>{projects.length}</strong>
          <span>Total Projects</span>
        </div>
      </div>

      {error && (
        <div className="projects-error">{error}</div>
      )}

      {success && (
        <div className="projects-success">{success}</div>
      )}

      <div className="projects-form-card">
        <h2>{editingId ? "Edit Project" : "Add New Project"}</h2>

        <p className="projects-subtitle">
          Add project information to your portfolio.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="projects-form-grid">
            <div className="projects-field">
              <label>Project Title *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter project title"
                required
              />
            </div>

            <div className="projects-field">
              <label>Category *</label>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Video Editing / Animation / 3D"
                required
              />
            </div>

            <div className="projects-field projects-full">
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe this project"
                rows="4"
              />
            </div>

            <div className="projects-field projects-full">
              <label>Thumbnail Image *</label>

              <input
                key={imageInputKey}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
              />

              {selectedImage && (
                <p>Selected: {selectedImage.name}</p>
              )}

              {form.imageUrl && (
                <div style={{ marginTop: "15px" }}>
                  <img
                    src={form.imageUrl}
                    alt="Project preview"
                    style={{
                      width: "180px",
                      height: "110px",
                      objectFit: "cover",
                      borderRadius: "10px",
                    }}
                  />

                  <p>
                    {selectedImage
                      ? "New image selected. It will replace the existing image when saved."
                      : "Current project image"}
                  </p>
                </div>
              )}

              <p className="projects-subtitle">
                Image uploads automatically when you save the project.
                Maximum size: 10 MB.
              </p>
            </div>

            <div className="projects-field projects-full">
              <label>Project Video / Demo URL</label>
              <input
                type="url"
                name="projectUrl"
                value={form.projectUrl}
                onChange={handleChange}
                placeholder="YouTube / Vimeo / Demo link"
              />
            </div>

            <div className="projects-field">
              <label>Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="projects-form-actions">
            {editingId && (
              <button
                type="button"
                className="projects-cancel-btn"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="projects-submit-btn"
              disabled={saving || uploadingImage}
            >
              {uploadingImage
                ? "Uploading Image..."
                : saving
                ? "Saving Project..."
                : editingId
                ? "Update Project"
                : "Add Project"}
            </button>
          </div>
        </form>
      </div>

      <div className="projects-list-card">
        <div className="projects-list-heading">
          <div>
            <h2>All Projects</h2>
            <p>Your portfolio projects.</p>
          </div>

          <button
            type="button"
            onClick={fetchProjects}
            className="projects-refresh-btn"
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="projects-empty">
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="projects-empty">
            <h3>No projects yet</h3>
            <p>Add your first project using the form above.</p>
          </div>
        ) : (
          <div className="projects-list">
            {projects.map((project) => (
              <div className="project-item" key={project.id}>
                {project.imageUrl ? (
                  <img
                    src={project.imageUrl}
                    alt={project.title}
                    className="project-thumbnail"
                  />
                ) : (
                  <div className="project-thumbnail-placeholder">
                    PROJECT
                  </div>
                )}

                <div className="project-info">
                  <h3>{project.title}</h3>
                  <p>{project.category}</p>

                  <span
                    className={`project-status ${
                      project.status === "Published"
                        ? "published"
                        : "draft"
                    }`}
                  >
                    {project.status || "Draft"}
                  </span>
                </div>

                <div className="project-actions">
                  {project.projectUrl && (
                    <a
                      href={project.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-view-btn"
                    >
                      View
                    </a>
                  )}

                  <button
                    type="button"
                    className="project-edit-btn"
                    onClick={() => handleEdit(project)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="project-delete-btn"
                    onClick={() => handleDelete(project.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectsManager;
