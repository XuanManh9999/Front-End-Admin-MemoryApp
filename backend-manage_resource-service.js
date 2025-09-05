import mysql from "../../config/mysql.js";

export const getResources = async (
  page,
  limit,
  search,
  category_id,
  file_type,
  collection_id,
  tag_id,
  status = null,
  plan = null
) => {
  // Convert and validate page and limit
  const pageNumber = Number(page) || 0;
  const limitNumber = Number(limit) || 10;
  const offset = pageNumber * limitNumber;

  console.log("Debug getResources params:", {
    pageNumber,
    limitNumber,
    offset,
    search,
    category_id,
    file_type,
    collection_id,
    tag_id,
    status,
    plan,
  });

  try {
    let baseQuery = `
      SELECT DISTINCT
        r.id,
        r.title,
        r.description,
        r.category_id,
        r.file_url,
        r.file_type,
        r.downloads,
        r.created_at,
        r.plan,
        r.status,
        r.detail,
        r.user_id,
        COALESCE(u.name, 'Unknown') as user_name,
        COALESCE(u.username_admin, 'Unknown') as user_username_admin,
        COALESCE(u.email, 'Unknown') as user_email,
        COALESCE(u.avatar, '') as user_avatar,
        COALESCE(u.role, 'user') as user_role,
        COALESCE(c.name, 'Unknown') as category_name,
        COALESCE(c.description, '') as category_description
      FROM resources r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN categories c ON r.category_id = c.id
    `;

    let joins = [];
    let conditions = [];
    let params = [];

    // Join với collection_resources nếu filter theo collection
    if (collection_id) {
      joins.push("INNER JOIN collection_resources cr ON r.id = cr.resource_id");
      conditions.push("cr.collection_id = ?");
      params.push(Number(collection_id));
    }

    // Join với resource_tags nếu filter theo tag
    if (tag_id) {
      joins.push("INNER JOIN resource_tags rt ON r.id = rt.resource_id");
      conditions.push("rt.tag_id = ?");
      params.push(Number(tag_id));
    }

    // Thêm joins vào query
    if (joins.length > 0) {
      baseQuery += " " + joins.join(" ");
    }

    // Filter conditions
    if (search) {
      conditions.push(
        "(r.title LIKE ? OR r.description LIKE ? OR u.name LIKE ?)"
      );
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category_id) {
      conditions.push("r.category_id = ?");
      params.push(Number(category_id));
    }

    if (file_type) {
      conditions.push("r.file_type = ?");
      params.push(file_type);
    }

    if (status) {
      conditions.push("r.status = ?");
      params.push(status);
    }

    if (plan) {
      conditions.push("r.plan = ?");
      params.push(plan);
    }

    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
      baseQuery += ` WHERE ${conditions.join(" AND ")}`;
    }

    // Add ordering and pagination
    baseQuery += ` ORDER BY r.created_at DESC LIMIT ${limitNumber} OFFSET ${offset}`;

    // Execute main query
    console.log("Executing query:", baseQuery);
    console.log("With params:", params);
    const [resources] = await mysql.execute(baseQuery, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM resources r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN categories c ON r.category_id = c.id
    `;

    // Add same joins for count query
    if (joins.length > 0) {
      countQuery += " " + joins.join(" ");
    }

    // Add same conditions for count query
    const countParams = [...params];
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(" AND ")}`;
    }

    const [countResult] = await mysql.execute(countQuery, countParams);
    const total = countResult[0].total;

    // Get additional info for each resource
    for (let resource of resources) {
      // Get statistics
      const [statsResult] = await mysql.execute(
        `
        SELECT 
          (SELECT COUNT(*) FROM favorites f WHERE f.resource_id = ?) as favorites_count,
          (SELECT COUNT(*) FROM reviews rv WHERE rv.resource_id = ?) as reviews_count,
          (SELECT AVG(rv2.rating) FROM reviews rv2 WHERE rv2.resource_id = ?) as avg_rating,
          (SELECT COUNT(*) FROM downloads d WHERE d.resource_id = ?) as download_count
      `,
        [resource.id, resource.id, resource.id, resource.id]
      );

      if (statsResult.length > 0) {
        resource.favorites_count = statsResult[0].favorites_count || 0;
        resource.reviews_count = statsResult[0].reviews_count || 0;
        resource.avg_rating = statsResult[0].avg_rating || 0;
        resource.download_count = statsResult[0].download_count || 0;
      }

      // Get tags
      const [tags] = await mysql.execute(
        `
        SELECT t.id, t.name
        FROM resource_tags rt
        INNER JOIN tags t ON rt.tag_id = t.id
        WHERE rt.resource_id = ?
        ORDER BY t.name
      `,
        [resource.id]
      );

      // Get collections
      const [collections] = await mysql.execute(
        `
        SELECT c.id, c.name, c.description, cr.added_at
        FROM collection_resources cr
        INNER JOIN collections c ON cr.collection_id = c.id
        WHERE cr.resource_id = ?
        ORDER BY cr.added_at DESC
      `,
        [resource.id]
      );

      resource.tags = tags;
      resource.collections = collections;
    }

    return {
      resources,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        totalResources: total,
        limit: limitNumber,
        hasNextPage: pageNumber < Math.ceil(total / limitNumber) - 1,
        hasPrevPage: pageNumber > 0,
      },
      filters: {
        search,
        category_id: category_id ? Number(category_id) : null,
        file_type,
        collection_id: collection_id ? Number(collection_id) : null,
        tag_id: tag_id ? Number(tag_id) : null,
        status,
        plan,
      },
    };
  } catch (error) {
    console.error("Error in getResources:", error);
    throw error;
  }
};

// Lấy resource theo ID với thông tin chi tiết đầy đủ
export const getResourceById = async (resourceId) => {
  try {
    const resourceIdNum = Number(resourceId);
    if (isNaN(resourceIdNum) || resourceIdNum <= 0) {
      throw new Error("ID tài nguyên không hợp lệ");
    }

    // Query chính để lấy thông tin resource
    const mainQuery = `
      SELECT 
        r.id,
        r.title,
        r.description,
        r.category_id,
        r.file_url,
        r.file_type,
        r.downloads,
        r.created_at,
        r.plan,
        r.status,
        r.detail,
        r.user_id,
        -- Thông tin user (chủ sở hữu)
        u.id as owner_id,
        u.name as owner_name,
        u.email as owner_email,
        u.avatar as owner_avatar,
        u.role as owner_role,
        u.status as owner_status,
        u.created_at as owner_joined_at,
        -- Thông tin category
        c.id as category_id,
        c.name as category_name,
        c.description as category_description,
        -- Thống kê chi tiết
        (SELECT COUNT(*) FROM favorites f WHERE f.resource_id = r.id) as favorites_count,
        (SELECT COUNT(*) FROM reviews rv WHERE rv.resource_id = r.id) as reviews_count,
        (SELECT AVG(rv2.rating) FROM reviews rv2 WHERE rv2.resource_id = r.id) as avg_rating,
        (SELECT COUNT(*) FROM downloads d WHERE d.resource_id = r.id) as actual_download_count,
        (SELECT COUNT(*) FROM reports rep WHERE rep.resource_id = r.id) as reports_count,
        (SELECT COUNT(*) FROM comments cm WHERE cm.resource_id = r.id) as comments_count
      FROM resources r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.id = ?
    `;

    const [resourceResult] = await mysql.execute(mainQuery, [resourceIdNum]);

    if (resourceResult.length === 0) {
      throw new Error("Không tìm thấy tài nguyên");
    }

    const resource = resourceResult[0];

    // Lấy tất cả tags của resource
    const [tags] = await mysql.execute(
      `
      SELECT 
        t.id,
        t.name
      FROM resource_tags rt
      INNER JOIN tags t ON rt.tag_id = t.id
      WHERE rt.resource_id = ?
      ORDER BY t.name
    `,
      [resourceIdNum]
    );

    // Lấy tất cả collections chứa resource này
    const [collections] = await mysql.execute(
      `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.created_at,
        c.user_id as collection_owner_id,
        owner.name as collection_owner_name,
        cr.added_at
      FROM collection_resources cr
      INNER JOIN collections c ON cr.collection_id = c.id
      INNER JOIN users owner ON c.user_id = owner.id
      WHERE cr.resource_id = ?
      ORDER BY cr.added_at DESC
    `,
      [resourceIdNum]
    );

    // Lấy reviews gần nhất (top 5)
    const [recentReviews] = await mysql.execute(
      `
      SELECT 
        rv.id,
        rv.rating,
        rv.comment,
        rv.created_at,
        rv.user_id,
        u.name as reviewer_name,
        u.avatar as reviewer_avatar
      FROM reviews rv
      INNER JOIN users u ON rv.user_id = u.id
      WHERE rv.resource_id = ?
      ORDER BY rv.created_at DESC
      LIMIT 5
    `,
      [resourceIdNum]
    );

    // Lấy comments gần nhất (top 5)
    const [recentComments] = await mysql.execute(
      `
      SELECT 
        cm.id,
        cm.content,
        cm.created_at,
        cm.user_id,
        u.name as commenter_name,
        u.avatar as commenter_avatar
      FROM comments cm
      INNER JOIN users u ON cm.user_id = u.id
      WHERE cm.resource_id = ?
      ORDER BY cm.created_at DESC
      LIMIT 5
    `,
      [resourceIdNum]
    );

    // Lấy downloads gần nhất (top 10)
    const [recentDownloads] = await mysql.execute(
      `
      SELECT 
        d.id,
        d.downloaded_at,
        d.user_id,
        u.name as downloader_name
      FROM downloads d
      INNER JOIN users u ON d.user_id = u.id
      WHERE d.resource_id = ?
      ORDER BY d.downloaded_at DESC
      LIMIT 10
    `,
      [resourceIdNum]
    );

    // Lấy reports nếu có (chỉ admin hoặc chủ sở hữu mới thấy)
    const [reports] = await mysql.execute(
      `
      SELECT 
        rep.id,
        rep.reason,
        rep.status,
        rep.created_at,
        rep.user_id,
        u.name as reporter_name
      FROM reports rep
      INNER JOIN users u ON rep.user_id = u.id
      WHERE rep.resource_id = ?
      ORDER BY rep.created_at DESC
    `,
      [resourceIdNum]
    );

    // Lấy resources liên quan (cùng category, cùng tags)
    const [relatedResources] = await mysql.execute(
      `
      SELECT DISTINCT
        r2.id,
        r2.title,
        r2.file_url,
        r2.file_type,
        r2.downloads,
        r2.created_at,
        u2.name as owner_name,
        (SELECT COUNT(*) FROM favorites f2 WHERE f2.resource_id = r2.id) as favorites_count
      FROM resources r2
      LEFT JOIN users u2 ON r2.user_id = u2.id
      LEFT JOIN resource_tags rt2 ON r2.id = rt2.resource_id
      WHERE r2.id != ? 
        AND r2.status = 'publish'
        AND (
          r2.category_id = ? 
          OR rt2.tag_id IN (
            SELECT rt.tag_id 
            FROM resource_tags rt 
            WHERE rt.resource_id = ?
          )
        )
      ORDER BY r2.created_at DESC
      LIMIT 8
    `,
      [resourceIdNum, resource.category_id, resourceIdNum]
    );

    // Tổng hợp kết quả
    return {
      // Thông tin cơ bản
      ...resource,

      // Thông tin liên quan
      tags,
      collections,

      // Hoạt động gần đây
      recentReviews,
      recentComments,
      recentDownloads,

      // Báo cáo (nếu có)
      reports,

      // Tài nguyên liên quan
      relatedResources,

      // Metadata
      metadata: {
        totalInteractions:
          resource.favorites_count +
          resource.reviews_count +
          resource.comments_count,
        popularityScore:
          (resource.favorites_count * 2 +
            resource.reviews_count * 1.5 +
            resource.actual_download_count * 1) /
          10,
        lastActivity:
          recentComments.length > 0
            ? recentComments[0].created_at
            : recentReviews.length > 0
            ? recentReviews[0].created_at
            : resource.created_at,
      },
    };
  } catch (error) {
    console.error("Error in getResourceById:", error);
    if (
      error.message === "Không tìm thấy tài nguyên" ||
      error.message === "ID tài nguyên không hợp lệ"
    ) {
      throw error;
    }
    throw new Error("Không thể lấy thông tin tài nguyên");
  }
};

export const getAllFileType = async () => {
  try {
    const [rows] = await mysql.query(
      "SELECT DISTINCT file_type FROM resources WHERE file_type IS NOT NULL ORDER BY file_type"
    );
    return rows;
  } catch (error) {
    console.error("Error in getAllFileType:", error);
    throw error;
  }
};

export const createResource = async (
  title,
  description,
  file_type,
  category_id,
  plan,
  detail,
  image,
  user,
  collection_id,
  tag_id,
  additional_tag_ids = [] // Thêm parameter cho additional tags
) => {
  // Bắt đầu transaction để đảm bảo tính toàn vẹn dữ liệu
  const connection = await mysql.getConnection();

  try {
    await connection.beginTransaction();

    if (
      !title ||
      !file_type ||
      !category_id ||
      !image ||
      !collection_id ||
      !tag_id
    ) {
      throw new Error("Vui lòng nhập đầy đủ thông tin bắt buộc");
    }

    // Validate collection_id và tag_id
    const collectionIdNum = Number(collection_id);
    const tagIdNum = Number(tag_id);
    const categoryIdNum = Number(category_id);

    if (isNaN(collectionIdNum) || collectionIdNum <= 0) {
      throw new Error("ID bộ sưu tập không hợp lệ");
    }
    if (isNaN(tagIdNum) || tagIdNum <= 0) {
      throw new Error("ID thẻ tag không hợp lệ");
    }
    if (isNaN(categoryIdNum) || categoryIdNum <= 0) {
      throw new Error("ID danh mục không hợp lệ");
    }

    // Kiểm tra category có tồn tại không
    const [categoryCheck] = await connection.execute(
      "SELECT id FROM categories WHERE id = ?",
      [categoryIdNum]
    );

    if (categoryCheck.length === 0) {
      throw new Error("Danh mục không tồn tại");
    }

    // Kiểm tra collection có tồn tại và thuộc về user không
    const [collectionCheck] = await connection.execute(
      "SELECT id FROM collections WHERE id = ? AND user_id = ?",
      [collectionIdNum, user.id]
    );

    if (collectionCheck.length === 0) {
      throw new Error(
        "Bộ sưu tập không tồn tại hoặc bạn không có quyền truy cập"
      );
    }

    // Kiểm tra tag có tồn tại không
    const [tagCheck] = await connection.execute(
      "SELECT id FROM tags WHERE id = ?",
      [tagIdNum]
    );

    if (tagCheck.length === 0) {
      throw new Error("Thẻ tag không tồn tại");
    }

    // Validate additional tags nếu có
    const validAdditionalTagIds = [];
    if (additional_tag_ids && Array.isArray(additional_tag_ids)) {
      for (const additionalTagId of additional_tag_ids) {
        const additionalTagIdNum = Number(additionalTagId);
        if (
          !isNaN(additionalTagIdNum) &&
          additionalTagIdNum > 0 &&
          additionalTagIdNum !== tagIdNum
        ) {
          const [additionalTagCheck] = await connection.execute(
            "SELECT id FROM tags WHERE id = ?",
            [additionalTagIdNum]
          );
          if (additionalTagCheck.length > 0) {
            validAdditionalTagIds.push(additionalTagIdNum);
          }
        }
      }
    }

    // Validate plan
    if (!["free", "premium"].includes(plan)) {
      throw new Error("Gói tài nguyên không hợp lệ");
    }

    // Tạo resource
    let columns = [
      "title",
      "file_type",
      "category_id",
      "file_url",
      "user_id",
      "plan",
      "status",
    ];

    const values = [
      title,
      file_type,
      categoryIdNum,
      image,
      user.id,
      plan,
      user.role === "admin" ? "publish" : "pending",
    ];
    const placeholders = ["?", "?", "?", "?", "?", "?", "?"];

    // Thêm description nếu có
    if (description && description.trim()) {
      columns.push("description");
      values.push(description.trim());
      placeholders.push("?");
    }

    // Thêm detail nếu có
    if (detail && detail.trim()) {
      columns.push("detail");
      values.push(detail.trim());
      placeholders.push("?");
    }

    const resourceQuery = `INSERT INTO resources (${columns.join(
      ", "
    )}) VALUES (${placeholders.join(", ")})`;

    console.log("Creating resource with query:", resourceQuery);
    console.log("Values:", values);

    const [resourceResult] = await connection.execute(resourceQuery, values);
    const newResourceId = resourceResult.insertId;

    console.log("Created resource with ID:", newResourceId);

    // Thêm vào bảng resource_tags (tag chính)
    const tagQuery =
      "INSERT INTO resource_tags (resource_id, tag_id) VALUES (?, ?)";
    await connection.execute(tagQuery, [newResourceId, tagIdNum]);

    console.log("Added primary tag:", tagIdNum);

    // Thêm additional tags
    for (const additionalTagId of validAdditionalTagIds) {
      await connection.execute(tagQuery, [newResourceId, additionalTagId]);
      console.log("Added additional tag:", additionalTagId);
    }

    // Thêm vào bảng collection_resources
    const collectionQuery =
      "INSERT INTO collection_resources (collection_id, resource_id, added_at) VALUES (?, ?, NOW())";
    await connection.execute(collectionQuery, [collectionIdNum, newResourceId]);

    console.log("Added to collection:", collectionIdNum);

    // Commit transaction
    await connection.commit();

    return {
      ...resourceResult,
      resourceId: newResourceId,
      message: `Tạo tài nguyên thành công và đã thêm vào bộ sưu tập với ${
        1 + validAdditionalTagIds.length
      } tag(s)`,
      tags_added: {
        primary_tag: tagIdNum,
        additional_tags: validAdditionalTagIds,
        total_tags: 1 + validAdditionalTagIds.length,
      },
    };
  } catch (error) {
    // Rollback transaction nếu có lỗi
    await connection.rollback();
    console.error("Error in createResource:", error);
    throw error;
  } finally {
    // Giải phóng connection
    connection.release();
  }
};

// Thêm tag cho resource (có thể thêm nhiều tags)
export const addTagsToResource = async (resourceId, tagIds, userId) => {
  const connection = await mysql.getConnection();

  try {
    await connection.beginTransaction();

    const resourceIdNum = Number(resourceId);
    if (isNaN(resourceIdNum) || resourceIdNum <= 0) {
      throw new Error("ID tài nguyên không hợp lệ");
    }

    // Kiểm tra resource có tồn tại và thuộc về user không (hoặc user là admin)
    const [resourceCheck] = await connection.execute(
      "SELECT id, user_id FROM resources WHERE id = ?",
      [resourceIdNum]
    );

    if (resourceCheck.length === 0) {
      throw new Error("Tài nguyên không tồn tại");
    }

    // Kiểm tra quyền sở hữu (trừ admin)
    const [userCheck] = await connection.execute(
      "SELECT role FROM users WHERE id = ?",
      [userId]
    );

    if (
      userCheck.length === 0 ||
      (userCheck[0].role !== "admin" && resourceCheck[0].user_id !== userId)
    ) {
      throw new Error("Bạn không có quyền chỉnh sửa tài nguyên này");
    }

    // Xử lý tagIds (có thể là array hoặc single value)
    const tagArray = Array.isArray(tagIds) ? tagIds : [tagIds];
    let addedCount = 0;

    for (const tagId of tagArray) {
      const tagIdNum = Number(tagId);
      if (isNaN(tagIdNum) || tagIdNum <= 0) {
        continue; // Skip invalid tag IDs
      }

      // Kiểm tra tag có tồn tại không
      const [tagCheck] = await connection.execute(
        "SELECT id FROM tags WHERE id = ?",
        [tagIdNum]
      );

      if (tagCheck.length === 0) {
        continue; // Skip non-existent tags
      }

      // Kiểm tra xem đã có tag này chưa
      const [existingTag] = await connection.execute(
        "SELECT 1 FROM resource_tags WHERE resource_id = ? AND tag_id = ?",
        [resourceIdNum, tagIdNum]
      );

      // Chỉ thêm nếu chưa có
      if (existingTag.length === 0) {
        await connection.execute(
          "INSERT INTO resource_tags (resource_id, tag_id) VALUES (?, ?)",
          [resourceIdNum, tagIdNum]
        );
        addedCount++;
      }
    }

    await connection.commit();
    return {
      success: true,
      message: `Thêm ${addedCount} tag(s) thành công`,
      added_count: addedCount,
    };
  } catch (error) {
    await connection.rollback();
    console.error("Error in addTagsToResource:", error);
    throw error;
  } finally {
    connection.release();
  }
};

// Xóa tag khỏi resource
export const removeTagFromResource = async (resourceId, tagId, userId) => {
  try {
    const resourceIdNum = Number(resourceId);
    const tagIdNum = Number(tagId);

    if (isNaN(resourceIdNum) || resourceIdNum <= 0) {
      throw new Error("ID tài nguyên không hợp lệ");
    }
    if (isNaN(tagIdNum) || tagIdNum <= 0) {
      throw new Error("ID tag không hợp lệ");
    }

    // Kiểm tra quyền sở hữu
    const [resourceCheck] = await mysql.execute(
      "SELECT user_id FROM resources WHERE id = ?",
      [resourceIdNum]
    );

    if (resourceCheck.length === 0) {
      throw new Error("Tài nguyên không tồn tại");
    }

    const [userCheck] = await mysql.execute(
      "SELECT role FROM users WHERE id = ?",
      [userId]
    );

    if (
      userCheck.length === 0 ||
      (userCheck[0].role !== "admin" && resourceCheck[0].user_id !== userId)
    ) {
      throw new Error("Bạn không có quyền chỉnh sửa tài nguyên này");
    }

    // Xóa tag
    const [result] = await mysql.execute(
      "DELETE FROM resource_tags WHERE resource_id = ? AND tag_id = ?",
      [resourceIdNum, tagIdNum]
    );

    if (result.affectedRows === 0) {
      throw new Error("Tag không tồn tại trong tài nguyên này");
    }

    return { success: true, message: "Xóa tag thành công" };
  } catch (error) {
    console.error("Error in removeTagFromResource:", error);
    throw error;
  }
};

// Thêm resource vào collection
export const addResourceToCollection = async (
  resourceId,
  collectionId,
  userId
) => {
  try {
    const resourceIdNum = Number(resourceId);
    const collectionIdNum = Number(collectionId);

    if (isNaN(resourceIdNum) || resourceIdNum <= 0) {
      throw new Error("ID tài nguyên không hợp lệ");
    }
    if (isNaN(collectionIdNum) || collectionIdNum <= 0) {
      throw new Error("ID bộ sưu tập không hợp lệ");
    }

    // Kiểm tra collection có tồn tại và thuộc về user không
    const [collectionCheck] = await mysql.execute(
      "SELECT user_id FROM collections WHERE id = ?",
      [collectionIdNum]
    );

    if (collectionCheck.length === 0) {
      throw new Error("Bộ sưu tập không tồn tại");
    }

    if (collectionCheck[0].user_id !== userId) {
      throw new Error("Bạn không có quyền truy cập bộ sưu tập này");
    }

    // Kiểm tra resource có tồn tại không
    const [resourceCheck] = await mysql.execute(
      "SELECT id FROM resources WHERE id = ?",
      [resourceIdNum]
    );

    if (resourceCheck.length === 0) {
      throw new Error("Tài nguyên không tồn tại");
    }

    // Kiểm tra xem đã có trong collection chưa
    const [existingEntry] = await mysql.execute(
      "SELECT 1 FROM collection_resources WHERE collection_id = ? AND resource_id = ?",
      [collectionIdNum, resourceIdNum]
    );

    if (existingEntry.length > 0) {
      throw new Error("Tài nguyên đã có trong bộ sưu tập này");
    }

    // Thêm vào collection
    await mysql.execute(
      "INSERT INTO collection_resources (collection_id, resource_id, added_at) VALUES (?, ?, NOW())",
      [collectionIdNum, resourceIdNum]
    );

    return {
      success: true,
      message: "Thêm tài nguyên vào bộ sưu tập thành công",
    };
  } catch (error) {
    console.error("Error in addResourceToCollection:", error);
    throw error;
  }
};

// Xóa resource khỏi collection
export const removeResourceFromCollection = async (
  resourceId,
  collectionId,
  userId
) => {
  try {
    const resourceIdNum = Number(resourceId);
    const collectionIdNum = Number(collectionId);

    if (isNaN(resourceIdNum) || resourceIdNum <= 0) {
      throw new Error("ID tài nguyên không hợp lệ");
    }
    if (isNaN(collectionIdNum) || collectionIdNum <= 0) {
      throw new Error("ID bộ sưu tập không hợp lệ");
    }

    // Kiểm tra quyền sở hữu collection
    const [collectionCheck] = await mysql.execute(
      "SELECT user_id FROM collections WHERE id = ?",
      [collectionIdNum]
    );

    if (collectionCheck.length === 0) {
      throw new Error("Bộ sưu tập không tồn tại");
    }

    if (collectionCheck[0].user_id !== userId) {
      throw new Error("Bạn không có quyền truy cập bộ sưu tập này");
    }

    // Xóa khỏi collection
    const [result] = await mysql.execute(
      "DELETE FROM collection_resources WHERE collection_id = ? AND resource_id = ?",
      [collectionIdNum, resourceIdNum]
    );

    if (result.affectedRows === 0) {
      throw new Error("Tài nguyên không có trong bộ sưu tập này");
    }

    return {
      success: true,
      message: "Xóa tài nguyên khỏi bộ sưu tập thành công",
    };
  } catch (error) {
    console.error("Error in removeResourceFromCollection:", error);
    throw error;
  }
};

// Lấy tất cả tags của một resource
export const getResourceTags = async (resourceId) => {
  try {
    const resourceIdNum = Number(resourceId);
    if (isNaN(resourceIdNum) || resourceIdNum <= 0) {
      throw new Error("ID tài nguyên không hợp lệ");
    }

    const [tags] = await mysql.execute(
      `
      SELECT 
        t.id,
        t.name,
        t.description
      FROM resource_tags rt
      INNER JOIN tags t ON rt.tag_id = t.id
      WHERE rt.resource_id = ?
      ORDER BY t.name
    `,
      [resourceIdNum]
    );

    return tags;
  } catch (error) {
    console.error("Error in getResourceTags:", error);
    throw error;
  }
};

// Lấy tất cả collections chứa một resource
export const getResourceCollections = async (resourceId) => {
  try {
    const resourceIdNum = Number(resourceId);
    if (isNaN(resourceIdNum) || resourceIdNum <= 0) {
      throw new Error("ID tài nguyên không hợp lệ");
    }

    const [collections] = await mysql.execute(
      `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.created_at,
        cr.added_at,
        u.name as owner_name
      FROM collection_resources cr
      INNER JOIN collections c ON cr.collection_id = c.id
      INNER JOIN users u ON c.user_id = u.id
      WHERE cr.resource_id = ?
      ORDER BY cr.added_at DESC
    `,
      [resourceIdNum]
    );

    return collections;
  } catch (error) {
    console.error("Error in getResourceCollections:", error);
    throw error;
  }
};

// Xóa resource với cascade delete
export const deleteResource = async (resourceId, userId) => {
  const connection = await mysql.getConnection();

  try {
    await connection.beginTransaction();

    const resourceIdNum = Number(resourceId);
    if (isNaN(resourceIdNum) || resourceIdNum <= 0) {
      throw new Error("ID tài nguyên không hợp lệ");
    }

    // Kiểm tra resource có tồn tại không và lấy thông tin chủ sở hữu
    const [resourceCheck] = await connection.execute(
      "SELECT id, user_id, title, file_url FROM resources WHERE id = ?",
      [resourceIdNum]
    );

    if (resourceCheck.length === 0) {
      throw new Error("Không tìm thấy tài nguyên");
    }

    const resource = resourceCheck[0];

    // Kiểm tra quyền xóa (chỉ chủ sở hữu hoặc admin)
    const [userCheck] = await connection.execute(
      "SELECT role FROM users WHERE id = ?",
      [userId]
    );

    if (userCheck.length === 0) {
      throw new Error("Người dùng không tồn tại");
    }

    if (userCheck[0].role !== "admin" && resource.user_id !== userId) {
      throw new Error("Bạn không có quyền xóa tài nguyên này");
    }

    // Xóa các bản ghi liên quan (cascade delete)
    console.log("Deleting related records for resource:", resourceIdNum);

    // 1. Xóa từ resource_tags
    await connection.execute(
      "DELETE FROM resource_tags WHERE resource_id = ?",
      [resourceIdNum]
    );

    // 2. Xóa từ collection_resources
    await connection.execute(
      "DELETE FROM collection_resources WHERE resource_id = ?",
      [resourceIdNum]
    );

    // 3. Xóa favorites
    await connection.execute("DELETE FROM favorites WHERE resource_id = ?", [
      resourceIdNum,
    ]);

    // 4. Xóa downloads
    await connection.execute("DELETE FROM downloads WHERE resource_id = ?", [
      resourceIdNum,
    ]);

    // 5. Xóa reviews
    await connection.execute("DELETE FROM reviews WHERE resource_id = ?", [
      resourceIdNum,
    ]);

    // 6. Xóa comments
    await connection.execute("DELETE FROM comments WHERE resource_id = ?", [
      resourceIdNum,
    ]);

    // 7. Xóa reports
    await connection.execute("DELETE FROM reports WHERE resource_id = ?", [
      resourceIdNum,
    ]);

    // 8. Cuối cùng xóa resource chính
    const [deleteResult] = await connection.execute(
      "DELETE FROM resources WHERE id = ?",
      [resourceIdNum]
    );

    if (deleteResult.affectedRows === 0) {
      throw new Error("Không thể xóa tài nguyên");
    }

    // Commit transaction
    await connection.commit();

    console.log("Successfully deleted resource:", resourceIdNum);

    return {
      success: true,
      message: "Xóa tài nguyên thành công",
      deletedResource: {
        id: resourceIdNum,
        title: resource.title,
        file_url: resource.file_url,
      },
    };
  } catch (error) {
    // Rollback transaction nếu có lỗi
    await connection.rollback();
    console.error("Error in deleteResource:", error);
    throw error;
  } finally {
    // Giải phóng connection
    connection.release();
  }
};

// Cập nhật resource
export const updateResource = async (
  resourceId,
  updateData,
  userId,
  newTagIds = null,
  newCollectionIds = null
) => {
  const connection = await mysql.getConnection();

  try {
    await connection.beginTransaction();

    const resourceIdNum = Number(resourceId);
    if (isNaN(resourceIdNum) || resourceIdNum <= 0) {
      throw new Error("ID tài nguyên không hợp lệ");
    }

    console.log("Updating resource:", resourceIdNum);
    console.log("Update data:", updateData);
    console.log("New tag IDs:", newTagIds);
    console.log("New collection IDs:", newCollectionIds);

    // Kiểm tra resource có tồn tại không
    const [resourceCheck] = await connection.execute(
      "SELECT id, user_id, title FROM resources WHERE id = ?",
      [resourceIdNum]
    );

    if (resourceCheck.length === 0) {
      throw new Error("Không tìm thấy tài nguyên");
    }

    const resource = resourceCheck[0];

    // Kiểm tra quyền chỉnh sửa
    const [userCheck] = await connection.execute(
      "SELECT role FROM users WHERE id = ?",
      [userId]
    );

    if (userCheck.length === 0) {
      throw new Error("Người dùng không tồn tại");
    }

    if (userCheck[0].role !== "admin" && resource.user_id !== userId) {
      throw new Error("Bạn không có quyền chỉnh sửa tài nguyên này");
    }

    // Chuẩn bị dữ liệu cập nhật
    const allowedFields = [
      "title",
      "description",
      "file_type",
      "category_id",
      "file_url",
      "plan",
      "detail",
      "status",
    ];

    let updateFields = [];
    let updateValues = [];

    // Lọc chỉ các trường được phép cập nhật
    for (const [key, value] of Object.entries(updateData)) {
      if (
        allowedFields.includes(key) &&
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }

    // Cập nhật resource nếu có dữ liệu
    if (updateFields.length > 0) {
      // Validate category_id nếu có
      if (updateData.category_id) {
        const [categoryCheck] = await connection.execute(
          "SELECT id FROM categories WHERE id = ?",
          [Number(updateData.category_id)]
        );
        if (categoryCheck.length === 0) {
          throw new Error("Danh mục không tồn tại");
        }
      }

      // Validate plan nếu có
      if (updateData.plan && !["free", "premium"].includes(updateData.plan)) {
        throw new Error("Gói tài nguyên không hợp lệ");
      }

      updateValues.push(resourceIdNum);
      const updateQuery = `UPDATE resources SET ${updateFields.join(
        ", "
      )} WHERE id = ?`;

      console.log("Executing update query:", updateQuery);
      console.log("With values:", updateValues);

      await connection.execute(updateQuery, updateValues);
    }

    // Cập nhật tags nếu có
    if (newTagIds && Array.isArray(newTagIds) && newTagIds.length > 0) {
      console.log("Updating tags...");

      // Xóa tất cả tags hiện tại
      await connection.execute(
        "DELETE FROM resource_tags WHERE resource_id = ?",
        [resourceIdNum]
      );

      // Thêm tags mới
      let addedTagsCount = 0;
      for (const tagId of newTagIds) {
        const tagIdNum = Number(tagId);
        if (isNaN(tagIdNum) || tagIdNum <= 0) continue;

        // Kiểm tra tag có tồn tại không
        const [tagCheck] = await connection.execute(
          "SELECT id FROM tags WHERE id = ?",
          [tagIdNum]
        );

        if (tagCheck.length > 0) {
          await connection.execute(
            "INSERT INTO resource_tags (resource_id, tag_id) VALUES (?, ?)",
            [resourceIdNum, tagIdNum]
          );
          addedTagsCount++;
          console.log("Added tag:", tagIdNum);
        }
      }
      console.log("Total tags added:", addedTagsCount);
    }

    // Cập nhật collections nếu có
    if (
      newCollectionIds &&
      Array.isArray(newCollectionIds) &&
      newCollectionIds.length > 0
    ) {
      console.log("Updating collections...");

      // Xóa khỏi tất cả collections hiện tại (chỉ của user này)
      await connection.execute(
        `
        DELETE cr FROM collection_resources cr
        INNER JOIN collections c ON cr.collection_id = c.id
        WHERE cr.resource_id = ? AND c.user_id = ?
      `,
        [resourceIdNum, userId]
      );

      // Thêm vào collections mới
      let addedCollectionsCount = 0;
      for (const collectionId of newCollectionIds) {
        const collectionIdNum = Number(collectionId);
        if (isNaN(collectionIdNum) || collectionIdNum <= 0) continue;

        // Kiểm tra collection có tồn tại và thuộc về user không
        const [collectionCheck] = await connection.execute(
          "SELECT id FROM collections WHERE id = ? AND user_id = ?",
          [collectionIdNum, userId]
        );

        if (collectionCheck.length > 0) {
          // Kiểm tra xem đã có trong collection chưa
          const [existingCheck] = await connection.execute(
            "SELECT 1 FROM collection_resources WHERE collection_id = ? AND resource_id = ?",
            [collectionIdNum, resourceIdNum]
          );

          if (existingCheck.length === 0) {
            await connection.execute(
              "INSERT INTO collection_resources (collection_id, resource_id, added_at) VALUES (?, ?, NOW())",
              [collectionIdNum, resourceIdNum]
            );
            addedCollectionsCount++;
            console.log("Added to collection:", collectionIdNum);
          }
        }
      }
      console.log("Total collections added:", addedCollectionsCount);
    }

    // Commit transaction
    await connection.commit();

    console.log("Resource update completed successfully");

    // Lấy thông tin resource đã cập nhật
    const updatedResource = await getResourceById(resourceIdNum);

    return {
      success: true,
      message: "Cập nhật tài nguyên thành công",
      resource: updatedResource,
    };
  } catch (error) {
    // Rollback transaction nếu có lỗi
    await connection.rollback();
    console.error("Error in updateResource:", error);
    throw error;
  } finally {
    // Giải phóng connection
    connection.release();
  }
};

// Cập nhật trạng thái resource (dành cho admin)
export const updateResourceStatus = async (resourceId, status, userId) => {
  try {
    const resourceIdNum = Number(resourceId);
    if (isNaN(resourceIdNum) || resourceIdNum <= 0) {
      throw new Error("ID tài nguyên không hợp lệ");
    }

    // Kiểm tra status hợp lệ
    if (!["pending", "publish", "rejected"].includes(status)) {
      throw new Error("Trạng thái không hợp lệ");
    }

    // Kiểm tra quyền admin
    const [userCheck] = await mysql.execute(
      "SELECT role FROM users WHERE id = ?",
      [userId]
    );

    if (userCheck.length === 0 || userCheck[0].role !== "admin") {
      throw new Error("Bạn không có quyền thực hiện thao tác này");
    }

    // Kiểm tra resource có tồn tại không
    const [resourceCheck] = await mysql.execute(
      "SELECT id, title FROM resources WHERE id = ?",
      [resourceIdNum]
    );

    if (resourceCheck.length === 0) {
      throw new Error("Không tìm thấy tài nguyên");
    }

    // Cập nhật trạng thái
    const [result] = await mysql.execute(
      "UPDATE resources SET status = ? WHERE id = ?",
      [status, resourceIdNum]
    );

    if (result.affectedRows === 0) {
      throw new Error("Không thể cập nhật trạng thái");
    }

    return {
      success: true,
      message: `Cập nhật trạng thái thành "${status}" thành công`,
      resource: {
        id: resourceIdNum,
        title: resourceCheck[0].title,
        status: status,
      },
    };
  } catch (error) {
    console.error("Error in updateResourceStatus:", error);
    throw error;
  }
};
