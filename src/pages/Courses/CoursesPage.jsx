import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, BookOpen, Search } from "lucide-react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";
import "./CoursePages.css";
import usePageTitle from "../../hooks/usePageTitle";

const ALL_CATEGORIES = "All";
const EASE = [0.22, 1, 0.36, 1];

const heroVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const titleVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const fadeOnlyVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
};

const lineRevealVariants = {
  hidden: { y: "110%" },
  show: { y: "0%", transition: { duration: 0.9, ease: EASE } },
};

const heroLines = [
  { text: "Learn Something" },
  { accent: "Extraordinary." },
];

function createSlug(title = "") {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const getCategory = (course) =>
  typeof course.category === "string" ? course.category.trim() : "";

const hasPrice = (price) =>
  price !== undefined && price !== null && String(price).trim() !== "";

const handleCardPointerMove = (event) => {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  card.style.setProperty("--my", `${event.clientY - rect.top}px`);
};

function CoursesPage() {
  usePageTitle("Courses");

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError("");

        const coursesQuery = query(
          collection(db, "courses"),
          where("status", "==", "Published")
        );

        const snapshot = await getDocs(coursesQuery);

        const courseList = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setCourses(courseList);
      } catch (err) {
        console.error("Courses fetch error:", err);
        setError("Unable to load courses. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const categories = useMemo(() => {
    const unique = [];
    courses.forEach((course) => {
      const category = getCategory(course);
      if (category && !unique.includes(category)) unique.push(category);
    });
    return unique;
  }, [courses]);

  const currentCategory = categories.includes(activeCategory)
    ? activeCategory
    : ALL_CATEGORIES;

  const filteredCourses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return courses.filter((course) => {
      if (currentCategory !== ALL_CATEGORIES && getCategory(course) !== currentCategory) {
        return false;
      }
      if (!term) return true;

      return [course.title, course.description, course.category].some(
        (value) => typeof value === "string" && value.toLowerCase().includes(term)
      );
    });
  }, [courses, currentCategory, searchTerm]);

  const clearFilters = () => {
    setSearchTerm("");
    setActiveCategory(ALL_CATEGORIES);
  };

  const fadeUp = reduceMotion ? fadeOnlyVariants : fadeUpVariants;
  const lineReveal = reduceMotion ? fadeOnlyVariants : lineRevealVariants;
  const showToolbar = !loading && !error && courses.length > 0;

  return (
    <main className="course-page">
      <div className="course-page-glow course-page-glow-one" aria-hidden="true" />
      <div className="course-page-glow course-page-glow-two" aria-hidden="true" />

      <motion.section
        className="course-page-hero"
        initial="hidden"
        animate="show"
        variants={heroVariants}
      >
        <motion.span className="course-page-eyebrow" variants={fadeUp}>
          INIFLOW Learning Space
        </motion.span>

        <motion.h1
          className="course-page-title"
          variants={titleVariants}
          aria-label="Learn Something Extraordinary."
        >
          {heroLines.map((line) => (
            <span className="course-page-title-line" key={line.text || line.accent}>
              <motion.span className="course-page-title-inner" variants={lineReveal}>
                {line.text}
                {line.accent && (
                  <span className="course-page-gradient-text">{line.accent}</span>
                )}
              </motion.span>
            </span>
          ))}
        </motion.h1>

        <motion.p className="course-page-subtitle" variants={fadeUp}>
          Discover creative courses, build new skills and
          turn your ideas into reality.
        </motion.p>
      </motion.section>

      <section className="course-catalog">
        <motion.div
          className="course-catalog-heading"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <div>
            <span className="course-page-eyebrow">Explore & Learn</span>
            <h2 className="course-section-title">All Courses</h2>
          </div>

          {showToolbar && (
            <span className="course-catalog-count">
              {filteredCourses.length} of {courses.length} courses
            </span>
          )}
        </motion.div>

        {showToolbar && (
          <motion.div
            className="course-catalog-toolbar"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          >
            <label className="course-search">
              <span className="course-sr-only">Search courses</span>
              <Search size={18} className="course-search-icon" aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search courses..."
              />
            </label>

            {categories.length > 1 && (
              <div
                className="course-filters"
                role="group"
                aria-label="Filter courses by category"
              >
                {[ALL_CATEGORIES, ...categories].map((category) => {
                  const isActive = category === currentCategory;

                  return (
                    <button
                      key={category}
                      type="button"
                      className={`course-filter ${isActive ? "is-active" : ""}`}
                      aria-pressed={isActive}
                      onClick={() => setActiveCategory(category)}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="course-filter-pill"
                          className="course-filter-pill"
                          transition={
                            reduceMotion
                              ? { duration: 0 }
                              : { type: "spring", stiffness: 380, damping: 32 }
                          }
                        />
                      )}
                      <span className="course-filter-text">{category}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {loading ? (
          <div className="course-catalog-grid" role="status">
            <span className="course-sr-only">Loading courses...</span>
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div className="course-skeleton-card" key={item} aria-hidden="true">
                <span className="course-skeleton-media" />
                <span className="course-skeleton-line" />
                <span className="course-skeleton-line is-short" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="course-state" role="alert">
            <span className="course-state-icon">
              <AlertCircle size={26} />
            </span>
            <p>{error}</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="course-state">
            <span className="course-state-icon">
              <BookOpen size={26} />
            </span>
            <h3>No courses available</h3>
            <p>New courses will be added soon.</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="course-state">
            <span className="course-state-icon">
              <Search size={26} />
            </span>
            <h3>No matching courses</h3>
            <p>Try a different search or category.</p>
            <button type="button" className="course-state-button" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="course-catalog-grid">
            <AnimatePresence>
              {filteredCourses.map((course, index) => {
                const coursePath = `/courses/${createSlug(course.title)}`;
                const category = getCategory(course);

                return (
                  <motion.article
                    key={course.id}
                    className="catalog-course-card"
                    layout={!reduceMotion}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
                    whileInView={{
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.6, ease: EASE, delay: (index % 3) * 0.08 },
                    }}
                    exit={{
                      opacity: 0,
                      scale: reduceMotion ? 1 : 0.95,
                      transition: { duration: 0.25 },
                    }}
                    whileHover={
                      reduceMotion
                        ? undefined
                        : { y: -8, transition: { type: "spring", stiffness: 260, damping: 22 } }
                    }
                    transition={{ layout: { duration: 0.5, ease: EASE } }}
                    viewport={{ once: true, amount: 0.15 }}
                    onPointerMove={handleCardPointerMove}
                  >
                    <Link
                      to={coursePath}
                      className="catalog-course-art"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      {course.banner ? (
                        <img src={course.banner} alt="" loading="lazy" decoding="async" />
                      ) : (
                        <span className="catalog-course-fallback">INIFLOW</span>
                      )}
                      <span className="catalog-course-shade" />
                    </Link>

                    <div className="catalog-course-info">
                      {category && (
                        <span className="catalog-course-category">{category}</span>
                      )}

                      <h3>{course.title}</h3>

                      {course.description && <p>{course.description}</p>}

                      <div className="catalog-course-footer">
                        {hasPrice(course.price) && (
                          <span className="catalog-course-price">₹{course.price}</span>
                        )}

                        <Link
                          to={coursePath}
                          className="catalog-course-link"
                          aria-label={`View course: ${course.title}`}
                        >
                          View Course
                          <ArrowRight size={16} className="catalog-course-link-icon" />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>
    </main>
  );
}

export default CoursesPage;