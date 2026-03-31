import { Router, type IRouter } from "express";

const router: IRouter = Router();

const HYPERCERTS_API_URLS = [
  "https://api.hypercerts.org/v1/graphql",
  "https://staging-api.hypercerts.org/v1/graphql",
  "https://hypercerts-api-production.up.railway.app/v1/graphql",
];

async function graphqlRequest(query: string, variables: Record<string, unknown> = {}) {
  let lastError: Error | null = null;

  for (const url of HYPERCERTS_API_URLS) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status} from ${url}`);
        continue;
      }

      const result = (await response.json()) as {
        data?: unknown;
        errors?: Array<{ message: string }>;
      };
      if (result.errors) {
        lastError = new Error(result.errors[0]?.message || "GraphQL error");
        continue;
      }

      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      continue;
    }
  }

  throw lastError || new Error("All API endpoints failed");
}

const LIST_QUERY = `
  query ListHypercerts($first: Int, $offset: Int) {
    hypercerts(first: $first, offset: $offset) {
      count
      data {
        hypercert_id
        uri
        creator_address
        units
        contract {
          chain_id
        }
        metadata {
          name
          description
          image
          work_scope
          work_timeframe_from
          work_timeframe_to
          impact_scope
          impact_timeframe_from
          impact_timeframe_to
          contributors
        }
        attestations {
          count
        }
      }
    }
  }
`;

const SEARCH_QUERY = `
  query SearchHypercerts($search: String!) {
    hypercerts(where: { metadata: { name: { contains: $search } } }, first: 20) {
      count
      data {
        hypercert_id
        metadata {
          name
          description
          work_scope
          contributors
        }
        attestations {
          count
        }
      }
    }
  }
`;

const DEMO_HYPERCERTS = [
  {
    hypercert_id: "demo-1",
    uri: "ipfs://demo1",
    creator_address: "0x1234...5678",
    units: "1000000",
    contract: { chain_id: 10 },
    metadata: {
      name: "Open Source Carbon Tracking Tool",
      description:
        "Built an open-source tool that helps small businesses track their carbon footprint. The tool integrates with accounting software to automatically calculate emissions from business activities. Used by 150+ businesses in the first year, collectively tracking over 50,000 tonnes of CO2.",
      image: null,
      work_scope: ["open-source", "climate", "carbon-tracking"],
      impact_scope: ["climate-action", "small-business"],
      work_timeframe_from: "2024-01-01",
      work_timeframe_to: "2024-12-31",
      impact_timeframe_from: "2024-01-01",
      impact_timeframe_to: "2026-12-31",
      contributors: ["GreenTech Labs", "Alice Chen", "Bob Smith"],
    },
    attestations: { count: 3 },
  },
  {
    hypercert_id: "demo-2",
    uri: "ipfs://demo2",
    creator_address: "0xabcd...ef01",
    units: "500000",
    contract: { chain_id: 8453 },
    metadata: {
      name: "Rural Education Access Program",
      description:
        "Provided internet connectivity and digital learning devices to 12 rural schools in Southeast Asia. Trained 45 teachers in digital literacy. Over 2,000 students gained access to online educational resources for the first time.",
      image: null,
      work_scope: ["education", "digital-access", "teacher-training"],
      impact_scope: ["education-equity", "digital-inclusion"],
      work_timeframe_from: "2023-06-01",
      work_timeframe_to: "2024-06-30",
      impact_timeframe_from: "2023-06-01",
      impact_timeframe_to: "2028-06-30",
      contributors: ["EduConnect Foundation", "Local Ministry of Education"],
    },
    attestations: { count: 5 },
  },
  {
    hypercert_id: "demo-3",
    uri: "ipfs://demo3",
    creator_address: "0x9876...5432",
    units: "2000000",
    contract: { chain_id: 10 },
    metadata: {
      name: "Decentralized Identity Protocol Research",
      description:
        "Conducted research on decentralized identity solutions for refugees and stateless individuals. Published 3 peer-reviewed papers and developed a prototype tested with UNHCR field offices. The protocol enables portable, self-sovereign identity that persists across borders.",
      image: null,
      work_scope: ["research", "identity", "decentralized-systems", "refugees"],
      impact_scope: ["human-rights", "digital-identity", "humanitarian"],
      work_timeframe_from: "2023-01-01",
      work_timeframe_to: "2024-12-31",
      impact_timeframe_from: "2023-01-01",
      impact_timeframe_to: "indefinite",
      contributors: [
        "Dr. Maria Gonzalez",
        "MIT Digital Currency Initiative",
        "UNHCR Innovation",
      ],
    },
    attestations: { count: 8 },
  },
  {
    hypercert_id: "demo-4",
    uri: "ipfs://demo4",
    creator_address: "0x5555...6666",
    units: "750000",
    contract: { chain_id: 42161 },
    metadata: {
      name: "Community Water Purification Project",
      description:
        "Installed solar-powered water purification systems in 8 villages. Each system can purify up to 10,000 liters of water per day. Reduced waterborne disease incidents by an estimated 60% in the first year.",
      image: null,
      work_scope: ["water", "infrastructure", "solar-energy"],
      impact_scope: ["clean-water", "public-health"],
      work_timeframe_from: "2024-03-01",
      work_timeframe_to: "2024-09-30",
      impact_timeframe_from: "2024-03-01",
      impact_timeframe_to: "2034-09-30",
      contributors: ["WaterFirst NGO", "SolarPure Technologies"],
    },
    attestations: { count: 2 },
  },
  {
    hypercert_id: "demo-5",
    uri: "ipfs://demo5",
    creator_address: "0x7777...8888",
    units: "300000",
    contract: { chain_id: 10 },
    metadata: {
      name: "Ethereum Protocol Security Audit",
      description:
        "Performed comprehensive security audits on 15 DeFi protocols. Found and responsibly disclosed 23 critical vulnerabilities before they could be exploited. Estimated $150M in user funds protected.",
      image: null,
      work_scope: ["security", "audit", "ethereum", "defi"],
      impact_scope: ["protocol-security", "user-protection"],
      work_timeframe_from: "2024-01-01",
      work_timeframe_to: "2024-06-30",
      impact_timeframe_from: "2024-01-01",
      impact_timeframe_to: "indefinite",
      contributors: ["SecureChain Labs"],
    },
    attestations: { count: 12 },
  },
  {
    hypercert_id: "demo-6",
    uri: "ipfs://demo6",
    creator_address: "0x2222...3333",
    units: "100000",
    contract: { chain_id: 8453 },
    metadata: {
      name: "Local Food Bank Automation",
      description:
        "Developed a logistics optimization system for a regional food bank network. The system reduced food waste by 35% and improved delivery efficiency, serving 40% more families with the same resources.",
      image: null,
      work_scope: ["logistics", "food-security", "automation"],
      impact_scope: ["hunger-relief", "waste-reduction"],
      work_timeframe_from: "2024-02-01",
      work_timeframe_to: "2024-08-31",
      impact_timeframe_from: "2024-02-01",
      impact_timeframe_to: "2027-08-31",
      contributors: ["TechForGood Volunteers", "Regional Food Bank Alliance"],
    },
    attestations: { count: 1 },
  },
];

router.get("/hypercerts", async (req, res) => {
  try {
    const first = parseInt((req.query.first as string) || "12");
    const offset = parseInt((req.query.offset as string) || "0");
    try {
      const result = await graphqlRequest(LIST_QUERY, { first, offset });
      const hypercerts = (result.data as { hypercerts?: { count: number; data: unknown[] } })
        ?.hypercerts;
      if (hypercerts && Array.isArray(hypercerts.data) && hypercerts.data.length > 0) {
        res.json(hypercerts);
        return;
      }
    } catch {
      req.log.warn("GraphQL API unavailable, using demo data");
    }
    res.json({
      count: DEMO_HYPERCERTS.length,
      data: DEMO_HYPERCERTS.slice(offset, offset + first),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching hypercerts");
    res.status(500).json({ error: (err as Error).message });
  }
});

const GET_BY_ID_QUERY = `
  query GetHypercert($hypercert_id: String!) {
    hypercerts(where: { hypercert_id: { eq: $hypercert_id } }) {
      data {
        hypercert_id
        uri
        creator_address
        units
        contract {
          chain_id
        }
        metadata {
          name
          description
          image
          work_scope
          work_timeframe_from
          work_timeframe_to
          impact_scope
          impact_timeframe_from
          impact_timeframe_to
          contributors
        }
        attestations {
          count
          data {
            uid
            attester
            data
            creation_block_timestamp
          }
        }
        fractions {
          count
          data {
            owner_address
            units
          }
        }
      }
    }
  }
`;

router.get("/hypercerts/:id", async (req, res) => {
  const hypercertId = req.params.id;
  try {
    const demo = DEMO_HYPERCERTS.find((h) => h.hypercert_id === hypercertId);
    if (demo) {
      res.json(demo);
      return;
    }

    try {
      const result = await graphqlRequest(GET_BY_ID_QUERY, { hypercert_id: hypercertId });
      const data = (result.data as { hypercerts?: { data: unknown[] } })?.hypercerts?.data;
      if (data && data.length > 0) {
        res.json(data[0]);
        return;
      }
    } catch {
      req.log.warn("GraphQL fetch by ID failed");
    }

    res.status(404).json({ error: `Hypercert not found: ${hypercertId}` });
  } catch (err) {
    req.log.error({ err }, "Error fetching hypercert by ID");
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/search", async (req, res) => {
  const q = req.query.q as string;
  if (!q) {
    res.status(400).json({ error: "Query parameter 'q' is required" });
    return;
  }
  try {
    try {
      const result = await graphqlRequest(SEARCH_QUERY, { search: q });
      const hypercerts = (result.data as { hypercerts?: { count: number; data: unknown[] } })
        ?.hypercerts;
      if (hypercerts && Array.isArray(hypercerts.data) && hypercerts.data.length > 0) {
        res.json(hypercerts);
        return;
      }
    } catch {
      req.log.warn("GraphQL search failed, using demo data");
    }
    const lower = q.toLowerCase();
    const filtered = DEMO_HYPERCERTS.filter(
      (h) =>
        h.metadata.name.toLowerCase().includes(lower) ||
        h.metadata.description.toLowerCase().includes(lower),
    );
    res.json({ count: filtered.length, data: filtered });
  } catch (err) {
    req.log.error({ err }, "Search error");
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
