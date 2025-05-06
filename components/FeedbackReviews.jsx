import React, { useState } from "react";
import { View, Text, StyleSheet, Button } from "react-native";

const MAX_VISIBLE = 4;

const splitComment = (comment, maxLength = 100) => {
  const lines = [];
  for (let i = 0; i < comment.length; i += maxLength) {
    lines.push(comment.slice(i, i + maxLength));
  }
  return lines;
};

export default function FeedbackReviews({ feedbacks }) {
  const [visibleCount, setVisibleCount] = useState(MAX_VISIBLE);

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + MAX_VISIBLE);
  };

  if (feedbacks.length === 0) {
    return <Text style={styles.noFeedback}>No feedback available.</Text>;
  }

  return (
    <View>
      {feedbacks.slice(0, visibleCount).map((fb) => (
        <View key={fb.id} style={styles.feedbackItem}>
          <Text style={styles.feedbackUser}>
            {fb.user.name || "Deleted user"}
          </Text>
          <Text style={styles.feedbackDate}>
            {new Date(
              fb.createdAt?.toDate?.() || fb.createdAt
            ).toLocaleString()}
          </Text>
          <Text style={styles.feedbackRating}>Rating: {fb.rating} / 5</Text>
          {splitComment(fb.comment).map((line, idx) => (
            <Text key={idx} style={styles.feedbackComment}>
              "{line}"
            </Text>
          ))}
        </View>
      ))}

      {visibleCount < feedbacks.length && (
        <View style={styles.showMoreContainer}>
          <Button title="Show More" onPress={handleShowMore} color="#F4CE14" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  feedbackItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  feedbackUser: {
    fontWeight: "bold",
    color: "#222",
  },
  feedbackDate: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  feedbackRating: {
    color: "#F4CE14",
    fontWeight: "600",
  },
  feedbackComment: {
    fontSize: 14,
    color: "#444",
  },
  noFeedback: {
    color: "#999",
    fontStyle: "italic",
  },
  showMoreContainer: {
    marginTop: 10,
    alignItems: "center",
  },
});
