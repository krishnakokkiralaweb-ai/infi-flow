import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Film, Play } from "lucide-react";
import { db } from "../../firebase/firebase";
import "./FeaturedProjects.css";

const ALL_CATEGORIES = "All";
const EASE = [0.22, 1, 0.36, 1];

const getCategory = (project) =>
  typeof project.category === "string" ? project.category.trim() : "";

const headingVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
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

const handleCardPointerMove = (event) => {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  card.style.setProperty("--my", `${event.clientY - rect.top}px`);
};

function FeaturedProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const projectsQuery = query(
      collection(db, "projects"),
      where("status", "==", "Published")
    );

    const unsubscribe = onSnapshot(
      projectsQuery,
      (snapshot) => {
        setProjects(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
        setLoading(false);
      },
      (error) => {
        console.error("Projects loading error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const categories = useMemo(() => {
    const unique = [];
    projects.forEach((project) => {
      const category = getCategory(project);
      if (category && !unique.includes(category)) unique.push(category);
    });
    return unique;
  }, [projects]);

  const currentCategory = categories.includes(activeCategory)
    ? activeCategory
    : ALL_CATEGORIES;

  const visibleProjects = useMemo(
    () =>
      currentCategory === ALL_CATEGORIES
        ? projects
        : projects.filter((project) => getCategory(project) === currentCategory),
    [projects, currentCategory]
  );

  const fadeUp = reduceMotion ? fadeOnlyVariants : fadeUpVariants;
  const lineReveal = reduceMotion ? fadeOnlyVariants : lineRevealVariants;
  const filterOptions = [ALL_CATEGORIES, ...categories];

  return (
    <section className="featured-projects" id="projects">
      <div className="projects-bg-glow projects-glow-one" aria-hidden="true" />
      <div className="projects-bg-glow projects-glow-two" aria-hidden="true" />

      <div className="featured-projects-container">
        <motion.div
          className="featured-projects-heading"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={headingVariants}
        >
          <motion.span className="featured-projects-label" variants={fadeUp}>
            My Creative Work
          </motion.span>

          <h2 className="featured-projects-title" aria-label="Featured Projects.">
            <span className="featured-projects-title-line">
              <motion.span
                className="featured-projects-title-inner"
                variants={lineReveal}
              >
                Featured{" "}
                <span className="featured-projects-gradient-text">Projects.</span>
              </motion.span>
            </span>
          </h2>

          <motion.p className="featured-projects-subtitle" variants={fadeUp}>
            A collection of creative ideas transformed into meaningful
            visual experiences.
          </motion.p>
        </motion.div>

        {loading ? (
          <div className="featured-projects-grid" role="status">
            <span className="featured-projects-sr-only">Loading projects...</span>
            {[0, 1, 2].map((item) => (
              <div className="featured-project-skeleton" key={item} aria-hidden="true">
                <span className="featured-project-skeleton-image" />
                <span className="featured-project-skeleton-line" />
                <span className="featured-project-skeleton-line is-short" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <motion.p
            className="featured-projects-message"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Projects coming soon.
          </motion.p>
        ) : (
          <>
            {categories.length > 1 && (
              <motion.div
                className="featured-projects-filters"
                role="group"
                aria-label="Filter projects by category"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                {filterOptions.map((category) => {
                  const isActive = category === currentCategory;

                  return (
                    <button
                      key={category}
                      type="button"
                      className={`featured-projects-filter ${isActive ? "is-active" : ""}`}
                      aria-pressed={isActive}
                      onClick={() => setActiveCategory(category)}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="projects-filter-pill"
                          className="featured-projects-filter-pill"
                          transition={
                            reduceMotion
                              ? { duration: 0 }
                              : { type: "spring", stiffness: 380, damping: 32 }
                          }
                        />
                      )}
                      <span className="featured-projects-filter-text">{category}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}

            <div className="featured-projects-grid">
              <AnimatePresence>
                {visibleProjects.map((project, index) => {
                  const category = getCategory(project);

                  return (
                    <motion.article
                      className="featured-project-card"
                      key={project.id}
                      layout={!reduceMotion}
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 32 }}
                      whileInView={{
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.7,
                          ease: EASE,
                          delay: (index % 3) * 0.08,
                        },
                      }}
                      exit={{
                        opacity: 0,
                        scale: reduceMotion ? 1 : 0.95,
                        transition: { duration: 0.25 },
                      }}
                      whileHover={
                        reduceMotion
                          ? undefined
                          : { y: -6, transition: { type: "spring", stiffness: 260, damping: 22 } }
                      }
                      transition={{ layout: { duration: 0.5, ease: EASE } }}
                      viewport={{ once: true, amount: 0.2 }}
                      onPointerMove={handleCardPointerMove}
                    >
                      <div className="featured-project-image">
                        {project.imageUrl ? (
                          <img
                            src={project.imageUrl}
                            alt={project.title || "Creative project"}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="featured-project-placeholder" aria-hidden="true">
                            <Film size={38} strokeWidth={1.5} />
                          </div>
                        )}

                        <span className="featured-project-shade" aria-hidden="true" />

                        {category && (
                          <span className="featured-project-chip">{category}</span>
                        )}

                        {String(project.projectUrl || "").toLowerCase().startsWith("https://") && (
                          <a
                            className="featured-project-play"
                            href={project.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View ${project.title || "project"}`}
                          >
                            <Play size={20} fill="currentColor" />
                          </a>
                        )}
                      </div>

                      <div className="featured-project-info">
                        <h3>{project.title}</h3>
                        {project.description && <p>{project.description}</p>}

                        {String(project.projectUrl || "").toLowerCase().startsWith("https://") && (
                          <a
                            className="featured-project-link"
                            href={project.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Explore Project
                            <ArrowUpRight size={17} className="featured-project-link-icon" />
                          </a>
                        )}
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default FeaturedProjects;