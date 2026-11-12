import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Download,
  ExternalLink,
  FileText,
} from "lucide-react";

import { db } from "../../firebase/firebase";
import "./CoursePages.css";

const EASE = [0.22, 1, 0.36, 1];

function createSlug(title = "") {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const hasPrice = (price) =>
  price !== undefined && price !== null && String(price).trim() !== "";

function CourseDetails() {
  const { slug } = useParams();

  const [course, setCourse] = useState(null);
  const [classes, setClasses] = useState([]);
  const [pdfs, setPdfs] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reduceMotion = useReducedMotion();
  const classesRef = useRef(null);
  const resourcesRef = useRef(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        setError("");

        setCourse(null);
        setClasses([]);
        setPdfs([]);
        setSelectedClassId("");

        // 1. Fetch published courses
        const courseQuery = query(
          collection(db, "courses"),
          where("status", "==", "Published")
        );

        const courseSnapshot = await getDocs(courseQuery);

        const matchedCourse = courseSnapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }))
          .find((item) => createSlug(item.title) === slug);

        if (!matchedCourse) {
          setCourse(null);
          return;
        }

        setCourse(matchedCourse);

        // 2. Fetch published classes belonging to this course
        const classSnapshot = await getDocs(
          query(
            collection(db, "classes"),
            where("courseId", "==", matchedCourse.id),
            where("status", "==", "Published")
          )
        );

        const courseClasses = classSnapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }))
          .filter(
            (item) =>
              item.courseId === matchedCourse.id &&
              item.status === "Published"
          )
          .sort(
            (a, b) =>
              Number(a.order || 0) - Number(b.order || 0)
          );

        setClasses(courseClasses);

        // 3. Fetch published PDFs
        const pdfQuery = query(
          collection(db, "pdfs"),
          where("status", "==", "Published")
        );

        const pdfSnapshot = await getDocs(pdfQuery);

        const coursePDFs = pdfSnapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }))
          .filter(
            (pdf) => pdf.courseId === matchedCourse.id && pdf.classId
          );

        setPdfs(coursePDFs);
      } catch (err) {
        console.error("Course details error:", err);
        setError("Unable to load course details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [slug]);

  // PDFs belonging only to the selected class
  const selectedClassPDFs = useMemo(() => {
    if (!selectedClassId) return [];

    return pdfs.filter(
      (pdf) => pdf.classId === selectedClassId
    );
  }, [pdfs, selectedClassId]);

  const pdfCountByClass = useMemo(() => {
    const counts = {};
    pdfs.forEach((pdf) => {
      counts[pdf.classId] = (counts[pdf.classId] || 0) + 1;
    });
    return counts;
  }, [pdfs]);

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId),
    [classes, selectedClassId]
  );

  useEffect(() => {
    if (!selectedClassId || !resourcesRef.current) return;
    resourcesRef.current.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
    });
  }, [selectedClassId, reduceMotion]);

  const scrollToClasses = () => {
    classesRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const riseIn = (delay = 0) =>
    reduceMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.4, delay } } }
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay } },
        };

  if (loading) {
    return (
      <main className="course-detail-page">
        <div className="course-detail-container" role="status">
          <span className="course-sr-only">Loading course...</span>
          <div className="course-detail-skeleton" aria-hidden="true">
            <span className="course-skeleton-line is-label" />
            <span className="course-skeleton-line is-title" />
            <span className="course-skeleton-line" />
            <span className="course-skeleton-line is-short" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="course-detail-page">
        <div className="course-detail-container">
          <div className="course-state" role="alert">
            <span className="course-state-icon">
              <AlertCircle size={26} />
            </span>
            <p>{error}</p>
            <Link to="/courses" className="course-state-button">
              Back to Courses
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!course) {
    return (
      <main className="course-detail-page">
        <div className="course-detail-container">
          <div className="course-state">
            <span className="course-state-icon">
              <BookOpen size={26} />
            </span>
            <h2>Course not found</h2>
            <p>This course may have been moved or is no longer available.</p>
            <Link to="/courses" className="course-state-button">
              Back to All Courses
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="course-detail-page">
      <div className="course-page-glow course-page-glow-one" aria-hidden="true" />
      <div className="course-page-glow course-page-glow-two" aria-hidden="true" />

      <div className="course-detail-container">
        <motion.div {...riseIn(0)}>
          <Link to="/courses" className="course-back-link">
            <ArrowLeft size={16} className="course-back-icon" />
            Back to All Courses
          </Link>
        </motion.div>

        {/* COURSE HERO */}
        <motion.section
          className={`course-detail-hero ${course.banner ? "has-banner" : ""}`}
          {...riseIn(0.1)}
        >
          <div className="course-detail-hero-content">
            {course.category && (
              <span className="course-page-eyebrow">{course.category}</span>
            )}

            <h1>{course.title}</h1>
            {course.description && <p>{course.description}</p>}

            <div className="course-detail-meta">
              {hasPrice(course.price) && (
                <span className="course-detail-chip is-price">₹{course.price}</span>
              )}
              <span className="course-detail-chip">
                <BookOpen size={16} />
                {classes.length} Learning Classes
              </span>
              <span className="course-detail-chip">
                <FileText size={16} />
                {pdfs.length} PDF Resources
              </span>
            </div>

            {classes.length > 0 && (
              <button
                type="button"
                className="course-detail-start"
                onClick={scrollToClasses}
              >
                Start Learning
                <ArrowDown size={17} className="course-detail-start-icon" />
              </button>
            )}
          </div>

          {course.banner && (
            <div className="course-detail-banner">
              <img src={course.banner} alt={course.title} />
            </div>
          )}
        </motion.section>

        {/* CLASSES SECTION */}
        <section className="course-learning-section" ref={classesRef}>
          <motion.div
            className="course-learning-heading"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <span className="course-page-eyebrow">Your Learning Journey</span>
            <h2 className="course-section-title">Explore Classes</h2>
            <p>Select a class to access its learning materials and PDFs.</p>
          </motion.div>

          {classes.length === 0 ? (
            <div className="course-state">
              <span className="course-state-icon">
                <BookOpen size={26} />
              </span>
              <h3>No classes available yet</h3>
              <p>Classes will be added soon.</p>
            </div>
          ) : (
            <div className="course-classes-grid">
              {classes.map((item, index) => {
                const isSelected = selectedClassId === item.id;
                const resourceCount = pdfCountByClass[item.id] || 0;

                return (
                  <motion.button
                    type="button"
                    className={`course-class-card ${isSelected ? "is-selected" : ""}`}
                    key={item.id}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedClassId(item.id)}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
                    whileInView={{
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5, ease: EASE, delay: (index % 4) * 0.06 },
                    }}
                    whileHover={
                      reduceMotion
                        ? undefined
                        : { y: -4, transition: { type: "spring", stiffness: 300, damping: 22 } }
                    }
                    viewport={{ once: true, amount: 0.3 }}
                  >
                    <span className="course-class-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="course-class-info">
                      <span className="course-class-label">Class {index + 1}</span>
                      <span className="course-class-title">{item.title}</span>
                      <span className="course-class-description">
                        {item.description || "Explore this learning class."}
                      </span>
                      <span className="course-class-count">
                        <FileText size={13} />
                        {resourceCount} PDF Resources
                      </span>
                    </span>

                    <span className="course-class-arrow" aria-hidden="true">
                      {isSelected ? <Check size={18} /> : <ArrowRight size={18} />}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </section>

        {/* SELECTED CLASS PDF SECTION */}
        {selectedClassId && (
          <motion.section
            className="course-selected-resources"
            key={selectedClassId}
            ref={resourcesRef}
            aria-live="polite"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <div className="course-learning-heading">
              <span className="course-page-eyebrow">Selected Class Material</span>
              <h2 className="course-section-title">{selectedClass?.title}</h2>
              <p>PDFs and learning resources for this class.</p>
            </div>

            {selectedClassPDFs.length === 0 ? (
              <div className="course-state is-compact">
                <span className="course-state-icon">
                  <FileText size={26} />
                </span>
                <h3>No PDFs available in this class</h3>
                <p>Learning materials will be added soon.</p>
              </div>
            ) : (
              <div className="course-pdf-list">
                {selectedClassPDFs.map((pdf, index) => (
                  <motion.div
                    className="course-pdf-item"
                    key={pdf.id}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: EASE, delay: index * 0.06 }}
                  >
                    <div className="course-pdf-icon" aria-hidden="true">
                      <FileText size={20} />
                      <span>PDF</span>
                    </div>

                    <div className="course-pdf-info">
                      <strong>{pdf.title}</strong>
                      <small>{pdf.description || "PDF Learning Material"}</small>
                    </div>

                    <div className="course-pdf-actions">
                      <a
                        href={pdf.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="course-pdf-view"
                      >
                        <ExternalLink size={16} />
                        View
                      </a>

                      <a
                        href={pdf.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="course-pdf-download"
                      >
                        <Download size={16} />
                        Download
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        )}
      </div>
    </main>
  );
}

export default CourseDetails;