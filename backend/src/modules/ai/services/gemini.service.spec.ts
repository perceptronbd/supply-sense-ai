import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { GeminiService } from "./gemini.service";
import { GoogleGenerativeAI } from "@google/generative-ai";

jest.mock("@google/generative-ai");

describe("GeminiService", () => {
  let service: GeminiService;
  let configService: ConfigService;
  let mockGenerateContent: jest.Mock;

  beforeEach(async () => {
    mockGenerateContent = jest.fn();
    const mockModel = {
      generateContent: mockGenerateContent,
    };
    const mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue(mockModel),
    };

    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => mockGenAI);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "GEMINI_API_KEY") return "test-api-key";
              if (key === "GEMINI_MODEL") return "gemini-pro";
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GeminiService>(GeminiService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("generateText", () => {
    it("should generate text successfully", async () => {
      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue("Generated text response"),
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await service.generateText("Test prompt");

      expect(result).toBe("Generated text response");
      expect(mockGenerateContent).toHaveBeenCalledWith("Test prompt");
    });
    it("should handle API errors gracefully", async () => {
      mockGenerateContent.mockRejectedValue(new Error("API Error"));

      await expect(service.generateText("Test prompt")).rejects.toThrow(
        "Failed to generate AI response"
      );
    });

    it("should handle empty response", async () => {
      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue(""),
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await service.generateText("Test prompt");

      expect(result).toBe("");
    });
  });

  describe("analyzeContent", () => {
    it("should analyze content and return structured response", async () => {
      const mockResponse = {
        response: {
          text: jest
            .fn()
            .mockReturnValue('{"analysis": "positive", "confidence": 0.8}'),
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);
      const result = await service.generateText("Sample content to analyze");

      expect(result).toBe('{"analysis": "positive", "confidence": 0.8}');
    });

    it("should handle invalid JSON in response", async () => {
      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue("Invalid JSON response"),
        },
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await service.generateText("Sample content");
      expect(result).toBe("Invalid JSON response");
    });
  });

  describe("initialization", () => {
    it("should throw error when generateText is called without API key", async () => {
      const moduleWithoutKey: TestingModule = await Test.createTestingModule({
        providers: [
          GeminiService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === "GEMINI_API_KEY") return null;
                if (key === "GEMINI_MODEL") return "gemini-pro";
                return null;
              }),
            },
          },
        ],
      }).compile();

      const serviceWithoutKey =
        moduleWithoutKey.get<GeminiService>(GeminiService);

      await expect(serviceWithoutKey.generateText("test")).rejects.toThrow(
        "Gemini AI not properly initialized"
      );
    });
  });
});
