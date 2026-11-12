
import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../../firebase/firebase";
import "./ClassesManager.css";

const initialForm = {
  courseId: "",
  title: "",
  description: "",
  order: "1",
  status: "Published",
};

function ClassesManager() {
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Reads data; the first state update happens after the await.
  const loadData = async () => {
    try {

      const [courseSnapshot, classSnapshot] = await Promise.all([
        getDocs(collection(db, "courses")),
        getDocs(collection(db, "classes")),
      ]);

      setCourses(
        courseSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );

      setClasses(
        classSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );
    } catch (err) {
      console.error("Classes fetch error:", err);
      setError("Unable to load courses and classes.");
    } finally {
      setLoading(false);
    }
  };

  // Used after save/delete: show the loader, then reload.
  const fetchData = async () => {
    setLoading(true);
    setError("");
    await loadData();
  };

  useEffect(() => {
    // Start the first load in a microtask so the effect itself sets no state.
    Promise.resolve().then(loadData);
  }, []);

  const handleChange = (e) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.courseId || !form.title.trim()) {
      setError("Please select a course and enter a class title.");
      return;
    }

    const selectedCourse = courses.find(
      (course) => course.id === form.courseId
    );

    if (!selectedCourse) {
      setError("Selected course was not found.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const classData = {
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.title,
        title: form.title.trim(),
        description: form.description.trim(),
        order: Math.max(1, Number(form.order) || 1),
        status: form.status,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "classes", editingId), classData);
        setSuccess("Class updated successfully!");
      } else {
        await addDoc(collection(db, "classes"), {
          ...classData,
          createdAt: serverTimestamp(),
        });
        setSuccess("Class added successfully!");
      }

      resetForm();
      await fetchData();
    } catch (err) {
      console.error("Class save error:", err);
      setError(err.message || "Unable to save class.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setForm({
      courseId: item.courseId || "",
      title: item.title || "",
      description: item.description || "",
      order: String(item.order || 1),
      status: item.status || "Published",
    });

    setEditingId(item.id);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete "${item.title}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      // Prevent deleting a class that still has PDF records.
      const pdfQuery = query(
        collection(db, "pdfs"),
        where("classId", "==", item.id)
      );

      const pdfSnapshot = await getDocs(pdfQuery);

      if (!pdfSnapshot.empty) {
        setError(
          "This class has PDFs linked to it. Remove or reassign those PDFs first."
        );
        return;
      }

      await deleteDoc(doc(db, "classes", item.id));

      setClasses((previous) =>
        previous.filter((classItem) => classItem.id !== item.id)
      );

      setSuccess("Class deleted successfully!");
    } catch (err) {
      console.error("Class delete error:", err);
      setError("Unable to delete class.");
    }
  };

  const filteredClasses = classes
    .filter((item) => {
      return !form.courseId || item.courseId === form.courseId;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="classes-manager">
      <div className="classes-heading">
        <div>
          <span className="classes-eyebrow">CONTENT MANAGEMENT</span>
          <h1>Course Classes</h1>
          <p>Create and manage classes inside each course.</p>
        </div>
      </div>

      {error && <div className="classes-message error">{error}</div>}
      {success && <div className="classes-message success">{success}</div>}

      <div className="classes-form-card">
        <h2>{editingId ? "Edit Class" : "Add New Class"}</h2>

        {courses.length === 0 && !loading ? (
          <p>Please create a course before adding classes.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="classes-form-grid">
              <div className="classes-field">
                <label>Select Course *</label>
                <select
                  name="courseId"
                  value={form.courseId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="classes-field">
                <label>Class Title *</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Introduction to Blender"
                  required
                />
              </div>

              <div className="classes-field">
                <label>Class Order *</label>
                <input
                  name="order"
                  type="number"
                  min="1"
                  value={form.order}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="classes-field">
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

              <div className="classes-field full">
                <label>Description</label>
                <textarea
                  name="description"
                  rows="3"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter class description"
                />
              </div>
            </div>

            <div className="classes-form-actions">
              {editingId && (
                <button
                  type="button"
                  className="classes-cancel-btn"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                className="classes-save-btn"
                disabled={saving || loading || courses.length === 0}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Class"
                  : "Add Class"}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="classes-list-card">
        <div className="classes-list-heading">
          <div>
            <h2>All Classes</h2>
            <p>Classes grouped by their selected course.</p>
          </div>

          <button
            type="button"
            className="classes-refresh-btn"
            onClick={fetchData}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="classes-empty">Loading classes...</p>
        ) : classes.length === 0 ? (
          <p className="classes-empty">No classes added yet.</p>
        ) : (
          <div className="classes-list">
            {courses.map((course) => {
              const courseClasses = filteredClasses.filter(
                (item) => item.courseId === course.id
              );

              if (form.courseId && form.courseId !== course.id) {
                return null;
              }

              if (courseClasses.length === 0) return null;

              return (
                <div className="classes-course-group" key={course.id}>
                  <h3>{course.title}</h3>

                  {courseClasses.map((item) => (
                    <div className="classes-item" key={item.id}>
                      <div className="classes-item-number">
                        {String(item.order || 1).padStart(2, "0")}
                      </div>

                      <div className="classes-item-info">
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                        <span
                          className={`classes-status ${
                            item.status === "Published"
                              ? "published"
                              : "draft"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="classes-item-actions">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClassesManager;
