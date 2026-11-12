
import { useEffect, useMemo, useState } from "react";
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
import "./PDFManager.css";

const initialForm = {
  title: "",
  courseId: "",
  courseTitle: "",
  classId: "",
  classTitle: "",
  description: "",
  pdfUrl: "",
  publicId: "",
  status: "Published",
};

function PDFManager() {
  const [pdfs, setPdfs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const selectedClasses = useMemo(() => {
    return classes
      .filter((item) => item.courseId === form.courseId)
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  }, [classes, form.courseId]);

  // Reads data; the first state update happens after the await.
  const loadData = async () => {
    try {

      const [pdfSnapshot, courseSnapshot, classSnapshot] =
        await Promise.all([
          getDocs(collection(db, "pdfs")),
          getDocs(collection(db, "courses")),
          getDocs(collection(db, "classes")),
        ]);

      setPdfs(
        pdfSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );

      setCourses(
        courseSnapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }))
          .filter((item) => item.status === "Published")
          .sort((a, b) => a.title.localeCompare(b.title))
      );

      setClasses(
        classSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );
    } catch (err) {
      console.error("PDF data fetch error:", err);
      setError("Unable to load PDF data. Please try again.");
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
    const { name, value } = e.target;

    if (name === "courseId") {
      const selectedCourse = courses.find((item) => item.id === value);

      setForm((previous) => ({
        ...previous,
        courseId: value,
        courseTitle: selectedCourse?.title || "",
        classId: "",
        classTitle: "",
      }));

      return;
    }

    if (name === "classId") {
      const selectedClass = classes.find((item) => item.id === value);

      setForm((previous) => ({
        ...previous,
        classId: value,
        classTitle: selectedClass?.title || "",
      }));

      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    if (file.type !== "application/pdf") {
      setError("Please select a PDF file.");
      e.target.value = "";
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("PDF size must be less than 20 MB.");
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);

      const result = await uploadToCloudinary(file, "pdf");

      setForm((previous) => ({
        ...previous,
        pdfUrl: result.url,
        publicId: result.publicId,
      }));
    } catch (err) {
      console.error("PDF upload error:", err);
      setError(err.message || "PDF upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.title.trim() ||
      !form.courseId ||
      !form.classId ||
      !form.pdfUrl.trim()
    ) {
      setError("Please enter the title, select a course and class, and upload a PDF.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const pdfData = {
        title: form.title.trim(),

        // Keep the old course field for compatibility.
        course: form.courseTitle,
        courseId: form.courseId,
        courseTitle: form.courseTitle,

        classId: form.classId,
        classTitle: form.classTitle,

        description: form.description.trim(),
        pdfUrl: form.pdfUrl.trim(),
        publicId: form.publicId || "",
        status: form.status,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "pdfs", editingId), pdfData);
      } else {
        await addDoc(collection(db, "pdfs"), {
          ...pdfData,
          createdAt: serverTimestamp(),
        });
      }

      setForm(initialForm);
      setEditingId(null);
      await fetchData();
    } catch (err) {
      console.error("PDF save error:", err);
      setError("Unable to save PDF. Please check Firebase permissions.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (pdf) => {
    const matchedCourse = courses.find(
      (item) =>
        item.id === pdf.courseId ||
        item.title === pdf.courseTitle ||
        item.title === pdf.course
    );

    setForm({
      title: pdf.title || "",
      courseId: pdf.courseId || matchedCourse?.id || "",
      courseTitle: pdf.courseTitle || pdf.course || matchedCourse?.title || "",
      classId: pdf.classId || "",
      classTitle: pdf.classTitle || "",
      description: pdf.description || "",
      pdfUrl: pdf.pdfUrl || "",
      publicId: pdf.publicId || "",
      status: pdf.status || "Published",
    });

    setEditingId(pdf.id);
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (pdf) => {
    const confirmDelete = window.confirm(
      "Delete this PDF record? The Cloudinary file will remain in storage."
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "pdfs", pdf.id));

      setPdfs((previous) =>
        previous.filter((item) => item.id !== pdf.id)
      );
    } catch (err) {
      console.error("PDF delete error:", err);
      setError("Unable to delete PDF.");
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    setEditingId(null);
    setError("");
  };

  return (
    <div className="pdf-manager">
      <div className="pdf-manager-header">
        <div>
          <span className="pdf-eyebrow">CONTENT MANAGEMENT</span>
          <h1>PDF Library</h1>
          <p>Manage course notes, resources and downloadable PDFs.</p>
        </div>

        <div className="pdf-count">
          <span>{pdfs.length}</span>
          <small>Total PDFs</small>
        </div>
      </div>

      {error && <div className="pdf-error">{error}</div>}

      <div className="pdf-form-card">
        <div className="pdf-section-heading">
          <div>
            <h2>{editingId ? "Edit PDF" : "Add New PDF"}</h2>
            <p>Assign each PDF to a specific course and class.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="pdf-form-grid">
            <div className="pdf-field">
              <label>PDF Title *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter PDF title"
                required
              />
            </div>

            <div className="pdf-field">
              <label>Course *</label>
              <select
                name="courseId"
                value={form.courseId}
                onChange={handleChange}
                required
              >
                <option value="">Select Course</option>

                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="pdf-field">
              <label>Class *</label>
              <select
                name="classId"
                value={form.classId}
                onChange={handleChange}
                disabled={!form.courseId || selectedClasses.length === 0}
                required
              >
                <option value="">Select Class</option>

                {selectedClasses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>

              {form.courseId && selectedClasses.length === 0 && (
                <small>No classes available for this course. Add a class first.</small>
              )}
            </div>

            <div className="pdf-field pdf-full">
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter a short description"
                rows="3"
              />
            </div>

            <div className="pdf-field pdf-full">
              <label>Upload PDF *</label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleUpload}
                disabled={uploading || saving}
              />

              {uploading && (
                <small>Uploading PDF to Cloudinary...</small>
              )}

              {form.pdfUrl && !uploading && (
                <small>
                  PDF uploaded successfully.{" "}
                  <a
                    href={form.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Preview PDF
                  </a>
                </small>
              )}
            </div>

            <div className="pdf-field">
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

          <div className="pdf-form-actions">
            {editingId && (
              <button
                type="button"
                className="pdf-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="pdf-submit-btn"
              disabled={saving || uploading}
            >
              {uploading
                ? "Uploading..."
                : saving
                ? "Saving..."
                : editingId
                ? "Update PDF"
                : "Add PDF"}
            </button>
          </div>
        </form>
      </div>

      <div className="pdf-list-card">
        <div className="pdf-section-heading">
          <div>
            <h2>All PDFs</h2>
            <p>Manage your existing PDF resources.</p>
          </div>

          <button
            type="button"
            className="pdf-refresh-btn"
            onClick={fetchData}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="pdf-empty">Loading PDFs...</div>
        ) : pdfs.length === 0 ? (
          <div className="pdf-empty">
            <h3>No PDFs added yet</h3>
            <p>Add your first PDF using the form above.</p>
          </div>
        ) : (
          <div className="pdf-list">
            {pdfs.map((pdf) => (
              <div className="pdf-item" key={pdf.id}>
                <div className="pdf-icon">PDF</div>

                <div className="pdf-item-info">
                  <h3>{pdf.title}</h3>

                  <p>
                    {pdf.courseTitle || pdf.course || "Course not assigned"}
                    {" / "}
                    {pdf.classTitle || "Class not assigned"}
                  </p>

                  <span
                    className={`pdf-status ${
                      pdf.status === "Published" ? "published" : "draft"
                    }`}
                  >
                    {pdf.status}
                  </span>

                  {!pdf.classId && (
                    <small>
                      Legacy PDF — edit and assign it to a class.
                    </small>
                  )}
                </div>

                <div className="pdf-item-actions">
                  <a
                    href={pdf.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pdf-view-btn"
                  >
                    View
                  </a>

                  <button
                    type="button"
                    className="pdf-edit-btn"
                    onClick={() => handleEdit(pdf)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="pdf-delete-btn"
                    onClick={() => handleDelete(pdf)}
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

export default PDFManager;
