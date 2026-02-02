import React, { useState, useEffect, useMemo, useRef } from "react";
import Papa from "papaparse";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

/* -------------------- ICONS -------------------- */
const SunIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const MoonIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M21 14.5A8.5 8.5 0 0 1 9.5 3a7 7 0 1 0 11.5 11.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const UploadIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M12 16V4m0 0 4 4m-4-4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M5 20h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const DownloadIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M12 4v12m0 0 4-4m-4 4-4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M5 20h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CloseIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="m7 7 10 10M7 17 17 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/* -------------------- HELPER: Format any key to readable text -------------------- */
const formatKey = (key) => {
  if (!key) return "";
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
};

/* -------------------- MAIN COMPONENT -------------------- */
export default function App() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  /* -------------------- THEME + TOAST -------------------- */
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  /* -------------------- STATS -------------------- */
  const stats = useMemo(() => {
    const stageSet = new Set();
    let mandatoryCount = 0;
    let automationCount = 0;
    let dependencyCount = 0;
    let validationCount = 0;

    rows.forEach((row) => {
      if (row["Stage Name"]) stageSet.add(row["Stage Name"]);
      if ((row["Field Type"] || "").toLowerCase() === "mandatory") mandatoryCount += 1;
      if (row["Automation Details"] && row["Automation Details"] !== "") automationCount += 1;
      if (row["Dependencies"] && row["Dependencies"] !== "N/A") dependencyCount += 1;
      if (row["Validations"] && row["Validations"] !== "N/A") validationCount += 1;
    });

    return {
      totalRows: rows.length,
      stages: stageSet.size,
      mandatory: mandatoryCount,
      automations: automationCount,
      dependencies: dependencyCount,
      validations: validationCount,
    };
  }, [rows]);

  const statHighlights = [
    { label: "Rows ready", value: stats.totalRows, helper: "records extracted" },
    { label: "Stages found", value: stats.stages, helper: "workflow stages" },
    { label: "Mandatory fields", value: stats.mandatory, helper: "must-fill inputs" },
    { label: "Dependencies", value: stats.dependencies, helper: "task prerequisites" },
    { label: "Validations", value: stats.validations, helper: "with rules applied" },
    { label: "Automations", value: stats.automations, helper: "tasks with automation" },
  ];

  /* -------------------- FILE UPLOAD -------------------- */
  const handleFileUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    setToast({ type: "info", message: `Processing ${file.name}...` });

    let jsonObjects = [];
    try {
      if (file.name.toLowerCase().endsWith(".zip")) {
        const zip = await JSZip.loadAsync(file);
        for (const filename of Object.keys(zip.files)) {
          if (!/\.json$/i.test(filename)) continue;
          const content = await zip.files[filename].async("string");
          const parsed = JSON.parse(content);
          jsonObjects.push(...(Array.isArray(parsed) ? parsed : [parsed]));
        }
      } else {
        const text = await file.text();
        const parsed = JSON.parse(text);
        jsonObjects = Array.isArray(parsed) ? parsed : [parsed];
      }

      const csvRows = [];
      jsonObjects.forEach((wf) => processWorkflow(wf, csvRows));

      // Move CJF rows first
      const sortedRows = [
        ...csvRows.filter((r) => r["Stage Name"] === "Create Job Form"),
        ...csvRows.filter((r) => r["Stage Name"] !== "Create Job Form"),
      ];

      setRows(sortedRows);
      setToast({
        type: "success",
        message: `Processed ${sortedRows.length} rows from ${file.name}`,
      });
    } catch (err) {
      console.error("Error:", err);
      setToast({
        type: "error",
        message: "Invalid file. Please upload a valid JSON or ZIP.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- PROCESS WORKFLOW -------------------- */
  const processWorkflow = (wf, csvRows) => {
    const parameterMap = {};
    const propertyNameMap = {};
    const optionMap = {};
    const visibilityMap = {};

    // -------------------- BUILD TASK MAP FOR DEPENDENCIES --------------------
    // Store with BOTH string and number keys to handle JSON inconsistencies
    const taskMap = {};
    
    wf.stageRequests?.forEach((stage, stageIdx) => {
      const stageOrder = stage.orderTree ?? stageIdx + 1;
      stage.taskRequests?.forEach((task, taskIdx) => {
        const taskOrder = task.orderTree ?? taskIdx + 1;
        const taskInfo = {
          taskName: task.name,
          stageName: stage.name,
          stageOrder: stageOrder,
          taskOrder: taskOrder,
        };
        // Store with multiple key formats to ensure lookup works
        taskMap[task.id] = taskInfo;
        taskMap[String(task.id)] = taskInfo;
        taskMap[Number(task.id)] = taskInfo;
      });
    });

    // -------------------- HELPER: Lookup task by ID --------------------
    const lookupTask = (taskId) => {
      return taskMap[taskId] || taskMap[String(taskId)] || taskMap[Number(taskId)] || null;
    };

    // -------------------- DYNAMIC CONSTRAINT FORMATTER --------------------
    const formatConstraint = (constraint) => {
      if (!constraint) return "";
      const constraintMappings = {
        "EQ": "equals",
        "NEQ": "not equals",
        "NE": "not equals",
        "LT": "is less than",
        "LTE": "is less than or equal to",
        "LE": "is less than or equal to",
        "GT": "is greater than",
        "GTE": "is greater than or equal to",
        "GE": "is greater than or equal to",
        "CONTAINS": "contains",
        "NOT_CONTAINS": "does not contain",
        "STARTS_WITH": "starts with",
        "ENDS_WITH": "ends with",
        "IN": "is in",
        "NOT_IN": "is not in",
        "BETWEEN": "is between",
        "IS_NULL": "is empty",
        "IS_NOT_NULL": "is not empty",
      };
      return constraintMappings[constraint.toUpperCase()] || formatKey(constraint);
    };

    // -------------------- DYNAMIC EXCEPTION TYPE FORMATTER --------------------
    const formatExceptionType = (exceptionType) => {
      if (!exceptionType) return "Default";
      const exceptionMappings = {
        "DEFAULT_FLOW": "Halt Parameter Exception",
        "HALT_PARAMETER_EXCEPTION": "Halt Parameter Exception",
        "SKIP_EXCEPTION": "Skip Exception",
        "WARNING_ONLY": "Warning Only",
        "WARNING": "Warning Only",
        "APPROVAL_REQUIRED": "Approval Required",
        "SOFT_EXCEPTION": "Soft Exception",
        "HARD_EXCEPTION": "Hard Exception",
      };
      return exceptionMappings[exceptionType.toUpperCase()] || formatKey(exceptionType);
    };

    // -------------------- DYNAMIC SELECTOR FORMATTER --------------------
    const formatSelector = (selector) => {
      if (!selector) return "";
      const selectorMappings = {
        "CONSTANT": "Constant",
        "PARAMETER": "Parameter",
        "PROPERTY": "Property",
        "VARIABLE": "Variable",
        "EXPRESSION": "Expression",
        "NONE": "None",
      };
      return selectorMappings[selector.toUpperCase()] || formatKey(selector);
    };

    // -------------------- DYNAMIC UNIT FORMATTER --------------------
    const formatUnit = (unit) => {
      if (!unit) return "";
      const unitMappings = {
        "DAYS": "Days from today",
        "DAY": "Days from today",
        "HOURS": "Hours from now",
        "HOUR": "Hours from now",
        "MINUTES": "Minutes from now",
        "MINUTE": "Minutes from now",
        "WEEKS": "Weeks from today",
        "WEEK": "Weeks from today",
        "MONTHS": "Months from today",
        "MONTH": "Months from today",
        "YEARS": "Years from today",
        "YEAR": "Years from today",
      };
      return unitMappings[unit.toUpperCase()] || formatKey(unit);
    };

    // -------------------- PARAM COLLECTION --------------------
    const collectParam = (param) => {
      if (!param) return;
      parameterMap[param.id] = param.label;
      propertyNameMap[param.id] = param.label;

      const options = Array.isArray(param.data)
        ? param.data
        : Array.isArray(param.data?.choices)
        ? param.data.choices
        : Array.isArray(param.data?.options)
        ? param.data.options
        : [];

      options.forEach((opt) => {
        if (opt?.id) optionMap[opt.id] = opt.name ?? opt.label ?? opt.displayName ?? opt.id;
        if (opt?.name) optionMap[opt.name] = opt.name;
        if (opt?.value) optionMap[opt.value] = opt.name ?? opt.label ?? opt.displayName ?? opt.value;
      });

      // Collect property info from propertyFilters in RESOURCE type parameters
      if (param.data?.propertyFilters?.fields) {
        param.data.propertyFilters.fields.forEach((filter) => {
          // Extract property ID from field like "searchable.692559bba9de4d179f65af5b"
          if (filter.field && typeof filter.field === 'string' && filter.field.startsWith('searchable.')) {
            const propId = filter.field.split('.')[1];
            if (filter.displayName) {
              propertyNameMap[propId] = filter.displayName;
            } else if (filter.externalId) {
              propertyNameMap[propId] = filter.externalId;
            }
          }

          // Collect displayName if available
          if (filter.displayName && filter.field) {
            // Also store with the full field name
            propertyNameMap[filter.field] = filter.displayName;
          }
        });
      }

      // Collect property options from propertyValidations
      if (param.validations) {
        param.validations.forEach((validation) => {
          validation.propertyValidations?.forEach((pv) => {
            if (pv.options) {
              pv.options.forEach((opt) => {
                if (opt.id) {
                  optionMap[opt.id] = opt.displayName || opt.name || opt.label || opt.id;
                }
              });
            }
            if (pv.propertyId) {
              const propName = pv.propertyDisplayName || pv.propertyExternalId;
              if (propName) {
                propertyNameMap[pv.propertyId] = propName;
              }
            }
          });
        });
      }

      if (param.rules?.length) {
        param.rules.forEach((rule) => {
          const triggerLabel = param.label;
          const inputValues = (rule.input || [])
            .map((inp) => optionMap[inp] || inp)
            .join(" / ");

          (rule.show?.parameters || []).forEach((targetId) => {
            visibilityMap[targetId] = `Visible when "${triggerLabel}" is "${inputValues}"`;
          });
        });
      }
    };

    // -------------------- PROPERTY MAPS --------------------
    wf.objects?.forEach((obj) =>
      obj.properties?.forEach((p) => {
        propertyNameMap[p.id] = p.displayName || p.name || p.label || p.id;
        // Collect options from properties
        if (p.choices) {
          p.choices.forEach((choice) => {
            if (choice.id) optionMap[choice.id] = choice.displayName || choice.name || choice.label || choice.id;
          });
        }
      })
    );
    wf.objectRequests?.forEach((obj) =>
      obj.propertyRequests?.forEach((p) => {
        propertyNameMap[p.id] = p.displayName || p.name || p.label || p.id;
        // Collect options from properties
        if (p.choices) {
          p.choices.forEach((choice) => {
            if (choice.id) optionMap[choice.id] = choice.displayName || choice.name || choice.label || choice.id;
          });
        }
      })
    );

    // -------------------- PARAMETER GATHERING --------------------
    wf.parameterRequests?.forEach(collectParam);
    wf.stageRequests?.forEach((stage) =>
      stage.taskRequests?.forEach((task) => {
        task.parameterRequests?.forEach(collectParam);

        // Collect choices from automation requests
        task.automationRequests?.forEach((auto) => {
          if (auto.actionDetails?.choices) {
            auto.actionDetails.choices.forEach((choice) => {
              if (choice.id) {
                optionMap[choice.id] = choice.displayName || choice.name || choice.label || choice.id;
              }
            });
          }
        });
      })
    );

    // -------------------- FILTERS --------------------
    const getFiltersText = (param) => {
      const propertyFilters = param?.data?.propertyFilters;
      if (!propertyFilters) return "";

      const fields = propertyFilters.fields || [];
      if (!fields.length) return "";

      const filterLines = fields.map((f, idx) => {
        const parts = [];

        // Extract property ID from field (e.g., "searchable.67b339d329cd0b40defdd89b" -> "67b339d329cd0b40defdd89b")
        let fieldName = f.displayName || f.externalId || f.field || null;
        let resolvedFieldName = null;

        // If field starts with "searchable.", extract the ID and look it up
        if (typeof fieldName === 'string' && fieldName.startsWith('searchable.')) {
          const propertyId = fieldName.split('.')[1];
          resolvedFieldName = propertyNameMap[propertyId];
        }
        // Similarly check if it's just an ID (hexadecimal-like string)
        else if (typeof fieldName === 'string' && fieldName.match(/^[a-f0-9]{24}$/)) {
          resolvedFieldName = propertyNameMap[fieldName];
        }
        // If it's already a readable name (not an ID pattern)
        else if (fieldName && !fieldName.includes('.') && !fieldName.match(/^[a-f0-9]{24}$/)) {
          resolvedFieldName = fieldName;
        }

        // Only add the Field line if we have a resolved readable name
        if (resolvedFieldName) {
          parts.push(`Field: ${resolvedFieldName}`);
        }

        if (f.fieldType) parts.push(`Type: ${formatKey(f.fieldType)}`);
        if (f.op) parts.push(`Condition: ${formatConstraint(f.op)}`);
        if (f.selector) parts.push(`Selector: ${formatSelector(f.selector)}`);

        // Only show values if selector is NOT Parameter
        if (f.values && f.values.length > 0 && f.selector && f.selector.toUpperCase() !== 'PARAMETER') {
          // Resolve value IDs to readable names
          const resolvedValues = f.values.map(val => {
            // Check if it's an ID pattern
            if (typeof val === 'string' && val.match(/^[a-f0-9]{24}$/)) {
              const resolved = optionMap[val] || propertyNameMap[val];
              // If we can't resolve it, skip this value entirely
              return resolved || null;
            }
            return val;
          }).filter(v => v !== null); // Remove unresolved IDs

          // Only add Values line if we have any resolved values
          if (resolvedValues.length > 0) {
            parts.push(`Values: ${resolvedValues.join(", ")}`);
          }
        }

        if (f.referencedParameterId) {
          const refLabel = parameterMap[f.referencedParameterId] || f.referencedParameterId;
          parts.push(`Referenced Parameter: ${refLabel}`);
        }
        return `Filter ${idx + 1}:\n  ${parts.join("\n  ")}`;
      });

      return filterLines.join("\n\n");
    };

    // -------------------- VALIDATIONS --------------------
    const getValidationsText = (param) => {
      const validations = param?.validations;
      if (!validations || !validations.length) return "";
      
      const allValidationTexts = [];
      
      validations.forEach((validation) => {
        const exceptionType = formatExceptionType(validation.exceptionApprovalType);
        
        const processValidationArray = (validationArray, typeName) => {
          if (!validationArray || !validationArray.length) return;
          
          validationArray.forEach((v, idx) => {
            const parts = [`${typeName} ${idx + 1}:`];
            parts.push(`  Exception Type: ${exceptionType}`);
            
            if (v.constraint) parts.push(`  Condition: ${formatConstraint(v.constraint)}`);
            if (v.selector) parts.push(`  Selector: ${formatSelector(v.selector)}`);

            // Resolve value if it's an ID and selector is Constant
            if (v.value !== undefined && v.value !== null) {
              let resolvedValue = v.value;
              if (v.selector && v.selector.toUpperCase() === 'CONSTANT' && typeof v.value === 'string' && v.value.match(/^[a-f0-9]{24}$/)) {
                resolvedValue = optionMap[v.value] || propertyNameMap[v.value] || v.value;
              }
              parts.push(`  Value: ${resolvedValue}`);
            }

            if (v.dateUnit) parts.push(`  Unit: ${formatUnit(v.dateUnit)}`);
            if (v.errorMessage) parts.push(`  Error Message: "${v.errorMessage}"`);
            
            if (v.referencedParameterId) {
              const refLabel = parameterMap[v.referencedParameterId] || v.referencedParameterId;
              parts.push(`  Referenced Parameter: ${refLabel}`);
            }
            
            if (v.propertyId) {
              // Try to resolve property ID to readable name
              let propName = propertyNameMap[v.propertyId];
              if (!propName && typeof v.propertyId === 'string' && v.propertyId.match(/^[a-f0-9]{24}$/)) {
                // If still not found and it looks like an ID, skip showing it
                propName = null;
              } else if (!propName) {
                propName = v.propertyId;
              }

              if (propName) {
                parts.push(`  Property: ${propName}`);
              }
            }
            
            if (v.parameterLabel) parts.push(`  Parameter: ${v.parameterLabel}`);
            if (v.minValue !== undefined) parts.push(`  Min Value: ${v.minValue}`);
            if (v.maxValue !== undefined) parts.push(`  Max Value: ${v.maxValue}`);
            
            allValidationTexts.push(parts.join("\n"));
          });
        };
        
        processValidationArray(validation.dateTimeParameterValidations, "Date/Time Validation");
        processValidationArray(validation.criteriaValidations, "Criteria Validation");
        processValidationArray(validation.propertyValidations, "Property Validation");
        processValidationArray(validation.resourceParameterValidations, "Resource Validation");
        processValidationArray(validation.relationPropertyValidations, "Relation Validation");
        
        if (validation.customValidations) {
          const parts = [`Custom Validation:`];
          parts.push(`  Exception Type: ${exceptionType}`);
          if (typeof validation.customValidations === 'object') {
            Object.keys(validation.customValidations).forEach((key) => {
              parts.push(`  ${formatKey(key)}: ${JSON.stringify(validation.customValidations[key])}`);
            });
          } else {
            parts.push(`  Details: ${validation.customValidations}`);
          }
          allValidationTexts.push(parts.join("\n"));
        }
      });
      
      return allValidationTexts.join("\n\n");
    };

    // -------------------- DEPENDENCIES --------------------
    const getDependenciesText = (task) => {
      const prereqs = task?.prerequisiteTaskIds;
      if (!prereqs || !prereqs.length) return "N/A";
      
      const depLines = prereqs.map((taskId) => {
        const taskInfo = lookupTask(taskId);
        
        if (taskInfo) {
          return `Stage ${taskInfo.stageOrder}: ${taskInfo.stageName}\n  → Task ${taskInfo.stageOrder}.${taskInfo.taskOrder}: ${taskInfo.taskName}`;
        }
        return `Task ID: ${taskId} (not found in workflow)`;
      });
      
      return `Tasks that need to be executed before this task:\n${depLines.join("\n")}`;
    };

    // -------------------- EXECUTOR LOCK --------------------
    const getExecutorLockText = (task) => {
      const lock = task?.taskExecutorLock;
      if (!lock) return "N/A";
      
      const lines = [];
      
      if (lock.hasToBeExecutorId) {
        const taskInfo = lookupTask(lock.hasToBeExecutorId);
        if (taskInfo) {
          lines.push(`Must be executed by same person as:\n  Task ${taskInfo.stageOrder}.${taskInfo.taskOrder}: ${taskInfo.taskName} (${taskInfo.stageName})`);
        } else {
          lines.push(`Must be executed by same person as: Task ID ${lock.hasToBeExecutorId}`);
        }
      }
      
      if (lock.cannotBeExecutorIds?.length) {
        const cannotBe = lock.cannotBeExecutorIds.map((taskId) => {
          const taskInfo = lookupTask(taskId);
          if (taskInfo) {
            return `Task ${taskInfo.stageOrder}.${taskInfo.taskOrder}: ${taskInfo.taskName} (${taskInfo.stageName})`;
          }
          return `Task ID: ${taskId}`;
        });
        lines.push(`Cannot be executed by same person as:\n  ${cannotBe.join("\n  ")}`);
      }
      
      return lines.length ? lines.join("\n\n") : "N/A";
    };

    // -------------------- AUTOMATIONS (ORIGINAL CODE - UNCHANGED) --------------------
    const buildAutomationText = (task) => {
      if (!task?.automationRequests?.length) return "";
      const automations = task.automationRequests.map((auto) => {
        const trigger = (auto.triggerType || "").replace(/_/g, " ").toLowerCase();
        const action = (auto.actionType || "").replace(/_/g, " ").toLowerCase();
        const name = auto.displayName || "Unnamed Automation";

        let objectType = auto.actionDetails?.objectTypeDisplayName || "Unknown Object Type";

        if (
          objectType === "Unknown Object Type" &&
          auto.actionDetails?.referencedParameterId
        ) {
          const refId = auto.actionDetails.referencedParameterId;
          const refParam =
            wf.parameterRequests?.find((p) => p.id === refId) ||
            wf.stageRequests?.flatMap((s) => s.taskRequests || [])
              .flatMap((t) => t.parameterRequests || [])
              .find((p) => p.id === refId);
          if (refParam?.data?.collection) objectType = refParam.data.collection;
        }

        const mappings =
          auto.actionDetails?.configuration
            ?.map((cfg) => {
              const paramLabel =
                cfg.parameterLabel ||
                cfg.parameterDisplayName ||
                propertyNameMap[cfg.parameterId] ||
                "";
              return paramLabel ? `• ${paramLabel}` : "";
            })
            .filter(Boolean)
            .join("\n") || "";

        return [
          `Automation: ${name}`,
          `Trigger: ${trigger}`,
          `Action: ${action}`,
          `Object Type: ${objectType}`,
          mappings ? `Parameters to be automated:\n${mappings}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      });
      return automations.join("\n\n");
    };

    // -------------------- MAKE ROW --------------------
    // isLastParam flag determines if task-level info (dependencies, executor lock, automation) should be shown
    const makeRow = (stage, task, param, automationText, taskObj = null, isLastParam = false) => {
      const branchingText = visibilityMap[param.id] || "N/A";
      const validationsText = getValidationsText(param) || "N/A";
      const filtersText = getFiltersText(param) || "N/A";
      
      // Task-level fields - only show on last parameter of the task
      const dependenciesText = isLastParam && taskObj ? getDependenciesText(taskObj) : "N/A";
      const executorLockText = isLastParam && taskObj ? getExecutorLockText(taskObj) : "N/A";
      const automationDetails = isLastParam ? (automationText || "") : "";

      let options = "N/A";
      if (Array.isArray(param.data)) {
        options = param.data.map((d) => d?.name || d?.label || d?.value).filter(Boolean).join(" • ");
      } else if (Array.isArray(param.data?.choices)) {
        options = param.data.choices.map((d) => d?.name || d?.label || d?.value).filter(Boolean).join(" • ");
      } else if (param.data?.collection) {
        options = `[Resource: ${param.data.objectTypeDisplayName || param.data.collection}]`;
      } else if (param.data?.text) {
        options = `[Instruction Text]`;
      }

      return {
        "Stage Name": stage,
        "Activity Name": task,
        "Performer": "Performer/Verifier",
        "Activity Description in detail": `Performer provides input for ${param.label}.`,
        "Instruction Title": param.label,
        "Options / Values": options || "N/A",
        "Field Type": param.mandatory ? "Mandatory" : "Optional",
        "Activity / Parameter Type": param.type || "N/A",
        "Dependencies": dependenciesText,
        "Executor Lock": executorLockText,
        "Branching": branchingText,
        "Filters": filtersText,
        "Validations": validationsText,
        "Automation Details": automationDetails,
        "Configuration Feasibility": "Configurable",
        "Configuration Feasibility Notes": "N/A",
        "Configuration Status": "Configured",
        "IS SELF VERIFICATION PRESENT?":
          param.verificationType === "SELF" || param.verificationType === "BOTH"
            ? "Enabled"
            : "Disabled",
        "Tester Comments": "N/A",
        "IS PEER VERIFICATION PRESENT?":
          param.verificationType === "BOTH" ? "Enabled" : "Disabled",
        "Tester Comments (B)": "N/A",
      };
    };

    // -------------------- PROCESS STAGES --------------------
    wf.stageRequests?.forEach((stage) => {
      stage.taskRequests?.forEach((task) => {
        const automationText = buildAutomationText(task);
        const params = task.parameterRequests || [];
        const lastIndex = params.length - 1;
        
        params.forEach((p, idx) => {
          const isLastParam = idx === lastIndex;
          csvRows.push(makeRow(stage.name, task.name, p, automationText, task, isLastParam));
        });
      });
    });

    // -------------------- PROCESS CJF PARAMETERS --------------------
    const cjfParams = wf.parameterRequests || [];
    const cjfLastIndex = cjfParams.length - 1;
    cjfParams.forEach((p, idx) => {
      const isLastParam = idx === cjfLastIndex;
      csvRows.push(makeRow("Create Job Form", p.label, p, "", null, isLastParam));
    });
  };

  /* -------------------- EXPORTS -------------------- */
  const downloadCSV = () => {
    const csv = Papa.unparse(rows, { delimiter: ";" });
    saveAs(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      "workflow_extracted.csv"
    );
  };

  const downloadXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Workflow");
    XLSX.writeFile(wb, "workflow_extracted.xlsx");
  };

  /* -------------------- FILE INPUT & DRAG HELPERS -------------------- */
  const handleFileInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) handleFileUpload(file);
    event.target.value = "";
  };

  const triggerFileDialog = () => fileInputRef.current?.click();

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const hasRows = rows.length > 0;
  const tableColumns = hasRows ? Object.keys(rows[0]) : [];

  /* -------------------- UI -------------------- */
  const toastTone = toast
    ? toast.type === "error"
      ? "bg-red-50 border-red-200 text-red-900 dark:bg-red-500/10 dark:border-red-500/40 dark:text-red-50"
      : toast.type === "success"
      ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/40 dark:text-emerald-50"
      : "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-500/10 dark:border-blue-500/40 dark:text-blue-50"
    : "";

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-950 text-gray-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl ${toastTone}`}
        >
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {toast.type === "error"
                ? "Upload failed"
                : toast.type === "success"
                ? "Ready to export"
                : "Working on it"}
            </p>
            <p className="text-sm leading-5 text-current">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="rounded-full p-1 text-current transition hover:bg-black/5 dark:hover:bg-white/10"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        {/* HEADER */}
        <header className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">
                Workflow Toolkit
              </p>
              <h1 className="text-3xl font-bold sm:text-4xl">
                Workflow JSON → CSV/XLSX Converter
              </h1>
              <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300">
                Convert workflow JSONs or ZIPs into structured tables including
                branching, filters, validations, dependencies, and automation summaries.
              </p>
            </div>
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                darkMode
                  ? "border-gray-700 bg-gray-900/60 hover:bg-gray-900"
                  : "border-slate-200 bg-white hover:bg-slate-100"
              }`}
            >
              {darkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
              {darkMode ? "Light mode" : "Dark mode"}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {statHighlights.map((stat) => (
              <div
                key={stat.label}
                className={`rounded-2xl border p-4 ${
                  darkMode
                    ? "border-gray-800 bg-gray-900/40"
                    : "border-slate-200 bg-white"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {stat.helper}
                </p>
              </div>
            ))}
          </div>
        </header>

        {/* Upload Dropzone */}
        <section
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-3xl border-2 border-dashed px-8 py-12 text-center transition ${
            dragActive
              ? "border-blue-500 bg-blue-50/70 dark:border-blue-400 dark:bg-blue-500/10"
              : darkMode
              ? "border-gray-700 bg-gray-900/40"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
            <UploadIcon
              className={`h-12 w-12 ${
                darkMode ? "text-blue-300" : "text-blue-600"
              }`}
            />
            <p className="text-lg font-semibold">
              Drag & drop your JSON or ZIP file
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Supports multiple workflows zipped together. Runs entirely in your
              browser.
            </p>
            <button
              onClick={triggerFileDialog}
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
            >
              Browse files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.zip"
              className="hidden"
              onChange={handleFileInputChange}
            />
          </div>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/90 backdrop-blur-sm dark:bg-gray-950/80">
              <div className="flex items-center gap-3 text-blue-600 dark:text-blue-300">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span className="text-sm font-semibold">Processing file...</span>
              </div>
            </div>
          )}
        </section>

        {/* Table Output */}
        {hasRows ? (
          <section className="space-y-6">
            <div
              className={`flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-6 ${
                darkMode
                  ? "border-gray-800 bg-gray-900/40"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div>
                <p className="text-sm font-semibold">Ready to export</p>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  {stats.totalRows} rows • {stats.stages} stages • {stats.dependencies} dependencies • {stats.validations} validations
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-2 rounded-full border border-blue-600 px-5 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-500/10"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Export CSV
                </button>
                <button
                  onClick={downloadXLSX}
                  className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-400"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Export XLSX
                </button>
              </div>
            </div>

            <div
              className={`rounded-3xl border ${
                darkMode
                  ? "border-gray-800 bg-gray-900/40"
                  : "border-slate-200 bg-white shadow-sm"
              }`}
            >
              <div className="max-h-[520px] overflow-auto rounded-3xl">
                <table className="min-w-full text-sm">
                  <thead
                    className={`sticky top-0 z-10 ${
                      darkMode ? "bg-gray-950" : "bg-slate-100"
                    }`}
                  >
                    <tr>
                      {tableColumns.map((key) => (
                        <th
                          key={key}
                          className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-gray-800 dark:text-slate-300"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody
                    className={
                      darkMode
                        ? "divide-y divide-gray-900/60"
                        : "divide-y divide-slate-100"
                    }
                  >
                    {rows.map((row, i) => (
                      <tr
                        key={i}
                        className={
                          i % 2 === 1
                            ? darkMode
                              ? "bg-gray-900/30"
                              : "bg-slate-50"
                            : undefined
                        }
                      >
                        {tableColumns.map((col) => (
                          <td
                            key={col}
                            className="px-4 py-3 align-top text-sm leading-6 text-slate-700 dark:text-slate-200 whitespace-pre-wrap max-w-xs"
                          >
                            {row[col] ?? "--"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : (
          <section
            className={`rounded-3xl border p-10 text-center ${
              darkMode
                ? "border-gray-800 bg-gray-900/40"
                : "border-slate-200 bg-white"
            }`}
          >
            <p className="text-lg font-semibold">No data yet</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              Upload a JSON or ZIP file above to see extracted parameters,
              branching, filters, validations, dependencies, and automation details.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
