
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  BookOpen,
  Pencil,
  Trash2,
  X,
  ImagePlus,
} from "lucide-react";

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
import "./CoursesManager.css";

const initialForm = {
  title: "",
  description: "",
  category: "",
  price: "",
  banner: "",
  bannerPublicId: "",
  status: "Published",
};

function CoursesManager() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [selectedBanner, setSelectedBanner] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch courses from Firestore
  // Reads data; the first state update happens after the await.
  const loadCourses = async () => {
    try {

      const snapshot = await getDocs(collection(db, "courses"));

      const courseList = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      setCourses(courseList);
    } catch (err) {
      console.error("Courses fetch error:", err);
      setError("Unable to load courses. Please check Firestore permissions.");
    } finally {
      setLoading(false);
    }
  };

  // Used after save/delete: show the loader, then reload.
  const fetchCourses = async () => {
    setLoading(true);
    setError("");
    await loadCourses();
  };

  useEffect(() => {
    // Start the first load in a microtask so the effect itself sets no state.
    Promise.resolve().then(loadCourses);
  }, []);

  // Reset form
  const resetForm = () => {
    setFormData(initialForm);
    setSelectedBanner(null);
    setEditingId(null);
    setShowForm(false);
    setError("");
    setSuccess("");
  };

  // Select banner image
  const handleBannerSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size should be below 10 MB.");
      e.target.value = "";
      return;
    }

    setSelectedBanner(file);
    setError("");
    setSuccess("");
  };

  // Add or update course
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.category.trim()) {
      setError("Please enter course title and category.");
      return;
    }

    if (!editingId && !selectedBanner) {
      setError("Please select a course banner image.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      let bannerUrl = formData.banner;
      let bannerPublicId = formData.bannerPublicId;

      // Automatically upload selected image to Cloudinary
      if (selectedBanner) {
        setUploadingBanner(true);

        const result = await uploadToCloudinary(
          selectedBanner,
          "image"
        );

        bannerUrl = result.url;
        bannerPublicId = result.publicId;

        setUploadingBanner(false);
      }

      // Prepare course data
      const courseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        price: Number(formData.price),
        banner: bannerUrl,
        bannerPublicId: bannerPublicId || "",
        status: formData.status,
        updatedAt: serverTimestamp(),
      };

      // Update existing course
      if (editingId) {
        await updateDoc(
          doc(db, "courses", editingId),
          courseData
        );
      } else {
        // Add new course
        await addDoc(collection(db, "courses"), {
          ...courseData,
          createdAt: serverTimestamp(),
        });
      }

      await fetchCourses();

      setSuccess("Course saved successfully!");
      setFormData(initialForm);
      setSelectedBanner(null);
      setEditingId(null);
      setShowForm(false);

    } catch (err) {
      console.error("Course save error:", err);
      setError(err.message || "Course could not be saved. Please try again.");
    } finally {
      setSaving(false);
      setUploadingBanner(false);
    }
  };

  // Edit course
  const handleEdit = (course) => {
    setFormData({
      title: course.title || "",
      description: course.description || "",
      category: course.category || "",
      price: course.price ?? "",
      banner: course.banner || "",
      bannerPublicId: course.bannerPublicId || "",
      status: course.status || "Published",
    });

    setSelectedBanner(null);
    setEditingId(course.id);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  // Delete course
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this course?"
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "courses", id));

      setCourses((prev) =>
        prev.filter((course) => course.id !== id)
      );
    } catch (err) {
      console.error("Course delete error:", err);
      setError("Unable to delete course. Please try again.");
    }
  };

  // Search courses
  const filteredCourses = courses.filter((course) =>
    (course.title || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="courses-manager">
      <div className="courses-heading">
        <div>
          <span className="courses-eyebrow">CONTENT MANAGEMENT</span>
          <h1>Courses</h1>
          <p>Create and manage your learning programs.</p>
        </div>

        <button
          className="add-course-btn"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus size={18} />
          Add New Course
        </button>
      </div>

      <div className="courses-stats">
        <div className="course-stat-card">
          <BookOpen size={22} />
          <div>
            <h2>{courses.length}</h2>
            <p>Total Courses</p>
          </div>
        </div>
      </div>

      {error && <p className="login-error">{error}</p>}
      {success && <p className="course-success">{success}</p>}

      <div className="courses-toolbar">
        <div className="courses-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="courses-table-wrapper">
        <table className="courses-table">
          <thead>
            <tr>
              <th>COURSE</th>
              <th>CATEGORY</th>
              <th>PRICE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="courses-empty">
                  Loading courses...
                </td>
              </tr>
            ) : filteredCourses.length === 0 ? (
              <tr>
                <td colSpan="5" className="courses-empty">
                  <BookOpen size={32} />
                  <h3>No courses found</h3>
                  <p>Add your first course to get started.</p>
                </td>
              </tr>
            ) : (
              filteredCourses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <div className="course-name-cell">
                      {course.banner ? (
                        <img
                          src={course.banner}
                          alt={course.title}
                        />
                      ) : (
                        <div className="course-placeholder">
                          <BookOpen size={20} />
                        </div>
                      )}

                      <div>
                        <strong>{course.title}</strong>
                        <span>{course.description}</span>
                      </div>
                    </div>
                  </td>

                  <td>{course.category}</td>
                  <td>₹{course.price}</td>

                  <td>
                    <span
                      className={`course-status ${(course.status || "draft").toLowerCase()}`}
                    >
                      {course.status}
                    </span>
                  </td>

                  <td>
                    <div className="course-actions">
                      <button
                        onClick={() => handleEdit(course)}
                        aria-label="Edit course"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        onClick={() => handleDelete(course.id)}
                        aria-label="Delete course"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="course-modal-overlay">
          <motion.div
            className="course-modal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="course-modal-header">
              <div>
                <h2>{editingId ? "Edit Course" : "Add New Course"}</h2>
                <p>Enter the course information below.</p>
              </div>

              <button onClick={resetForm} aria-label="Close">
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>Course Title</label>
              <input
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    title: e.target.value,
                  })
                }
                placeholder="e.g. Professional Video Editing"
              />

              <label>Description</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                placeholder="Enter course description"
              />

              <label>Category</label>
              <input
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value,
                  })
                }
                placeholder="e.g. Video Editing"
              />

              <label>Course Price (₹)</label>
              <input
                type="number"
                min="0"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: e.target.value,
                  })
                }
                placeholder="Enter price"
              />

              <label>Banner Image</label>

              <div className="course-image-input">
                <ImagePlus size={18} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerSelect}
                />
              </div>

              {selectedBanner && (
                <p className="course-upload-info">
                  Selected: {selectedBanner.name}
                </p>
              )}

              {formData.banner && !selectedBanner && (
                <div className="course-banner-preview">
                  <img
                    src={formData.banner}
                    alt="Current course banner"
                  />
                </div>
              )}

              {selectedBanner && (
                <div className="course-banner-preview">
                  <p>New banner selected. It will upload when you save.</p>
                </div>
              )}

              <label>Course Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value,
                  })
                }
              >
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>

              <div className="course-form-actions">
                <button
                  type="button"
                  className="cancel-course-btn"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-course-btn"
                  disabled={saving}
                >
                  {uploadingBanner
                    ? "Uploading Image..."
                    : saving
                    ? "Saving Course..."
                    : editingId
                    ? "Update Course"
                    : "Save Course"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default CoursesManager;
