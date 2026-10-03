package com.example.orders.order;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** Full-stack test: HTTP -> controller -> service -> JPA -> Flyway-migrated schema (H2 in PostgreSQL mode). */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OrderApiIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OrderRepository repository;

    @BeforeEach
    void cleanDatabase() {
        repository.deleteAll();
    }

    @Test
    void createThenGetAndList() throws Exception {
        long id = createOrder("Ada Lovelace", "ada@example.com", "19.99");

        mvc.perform(get("/api/orders/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customerName", is("Ada Lovelace")))
                .andExpect(jsonPath("$.totalAmount", is(19.99)))
                .andExpect(jsonPath("$.status", is("NEW")))
                .andExpect(jsonPath("$.createdAt", notNullValue()));

        mvc.perform(get("/api/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is((int) id)));
    }

    @Test
    void createReturns201WithLocationHeader() throws Exception {
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("Ada", "ada@example.com", "5.00")))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"));
    }

    @Test
    void invalidCreateReturnsStructuredValidationErrors() throws Exception {
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("", "not-an-email", "-1")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", is("Validation failed")))
                .andExpect(jsonPath("$.violations[?(@.field=='customerName')]").exists())
                .andExpect(jsonPath("$.violations[?(@.field=='customerEmail')]").exists())
                .andExpect(jsonPath("$.violations[?(@.field=='totalAmount')]").exists());
    }

    @Test
    void malformedJsonReturnsStructuredBadRequest() throws Exception {
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)));
    }

    @Test
    void unknownOrderReturnsStructured404() throws Exception {
        mvc.perform(get("/api/orders/{id}", 999999))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.message", notNullValue()));
    }

    @Test
    void statusCanBeChangedAlongAllowedPath() throws Exception {
        long id = createOrder("Ada", "ada@example.com", "10.00");

        changeStatus(id, "PROCESSING").andExpect(status().isOk()).andExpect(jsonPath("$.status", is("PROCESSING")));
        changeStatus(id, "SHIPPED").andExpect(status().isOk()).andExpect(jsonPath("$.status", is("SHIPPED")));
    }

    @Test
    void forbiddenTransitionReturns409AndKeepsStatus() throws Exception {
        long id = createOrder("Ada", "ada@example.com", "10.00");

        changeStatus(id, "SHIPPED").andExpect(status().isConflict()).andExpect(jsonPath("$.status", is(409)));

        mvc.perform(get("/api/orders/{id}", id)).andExpect(jsonPath("$.status", is("NEW")));
    }

    @Test
    void unknownStatusValueReturns400() throws Exception {
        long id = createOrder("Ada", "ada@example.com", "10.00");

        changeStatus(id, "BOGUS").andExpect(status().isBadRequest());
    }

    private org.springframework.test.web.servlet.ResultActions changeStatus(long id, String newStatus)
            throws Exception {
        return mvc.perform(patch("/api/orders/{id}/status", id).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"" + newStatus + "\"}"));
    }

    private long createOrder(String name, String email, String amount) throws Exception {
        String json = mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(name, email, amount)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode node = objectMapper.readTree(json);
        return node.get("id").asLong();
    }

    private String createBody(String name, String email, String amount) {
        return "{\"customerName\":\"" + name + "\",\"customerEmail\":\"" + email + "\",\"totalAmount\":" + amount + "}";
    }
}
