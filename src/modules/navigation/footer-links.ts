/** Public footer routes. Keep customer actions, partner access and legal links distinct. */
export const footerGroups=[
  {
    "id": "shop",
    "title": [
      "Materials & orders",
      "सामग्री और ऑर्डर"
    ],
    "links": [
      [
        "/materials",
        "Construction materials",
        "निर्माण सामग्री"
      ],
      [
        "/brands",
        "Browse brands",
        "ब्रांड देखें"
      ],
      [
        "/checkout?cart=1",
        "Shopping cart",
        "शॉपिंग कार्ट"
      ],
      [
        "/quotes",
        "Prepare a quote",
        "कोटेशन बनाएं"
      ],
      [
        "/account/orders",
        "My orders",
        "मेरे ऑर्डर"
      ],
      [
        "/account/quotes",
        "My quotations",
        "मेरे कोटेशन"
      ]
    ]
  },
  {
    "id": "studio",
    "title": [
      "Home Studio",
      "होम स्टूडियो"
    ],
    "links": [
      [
        "/design-studio",
        "Plan my home",
        "घर का प्लान"
      ],
      [
        "/design-studio/portfolio",
        "2D + 3D layouts",
        "2D + 3D नक्शे"
      ],
      [
        "/design-studio/fit",
        "Check plot fit",
        "प्लॉट की जाँच"
      ],
      [
        "/design-studio/visualizer",
        "Paint Studio",
        "कलर स्टूडियो"
      ],
      [
        "/family-homes",
        "Family home ideas",
        "घर के विचार"
      ],
      [
        "/studio-pricing",
        "Studio pricing",
        "स्टूडियो मूल्य"
      ]
    ]
  },
  {
    "id": "resources",
    "title": [
      "Planning & learning",
      "योजना और जानकारी"
    ],
    "links": [
      [
        "/basket?view=planner",
        "Material planner",
        "सामग्री योजना"
      ],
      [
        "/my-project",
        "My Project",
        "मेरा प्रोजेक्ट"
      ],
      [
        "/blog",
        "Buying guides",
        "खरीदारी गाइड"
      ],
      [
        "/learn",
        "Knowledge hub",
        "जानकारी केंद्र"
      ],
      [
        "/build-iq",
        "Neerva Academy",
        "नीरवा अकादमी"
      ],
      [
        "/design-studio/road-planner",
        "Road-facing plans",
        "सड़क की ओर घर के नक्शे"
      ]
    ]
  },
  {
    "id": "help",
    "title": [
      "Help & business",
      "सहायता और व्यवसाय"
    ],
    "links": [
      [
        "/support",
        "Customer support",
        "ग्राहक सहायता"
      ],
      [
        "/account",
        "My account",
        "मेरा अकाउंट"
      ],
      [
        "/account/dealer",
        "Become a dealer",
        "डीलर बनें"
      ],
      [
        "/business-model",
        "Dealer information",
        "डीलर जानकारी"
      ],
      [
        "/install",
        "Install the app",
        "ऐप इंस्टॉल करें"
      ]
    ]
  }
] as const;
export const footerPolicies=[
  [
    "/privacy",
    "Privacy policy",
    "गोपनीयता नीति"
  ],
  [
    "/terms",
    "Terms of service",
    "नियम और शर्तें"
  ],
  [
    "/returns",
    "Returns & refunds",
    "वापसी और रिफंड"
  ]
] as const;
